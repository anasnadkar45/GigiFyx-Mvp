import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  age: z.union([z.number().min(1).max(150), z.string().transform((val) => Number.parseInt(val))]).optional(),
  address: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bloodGroup: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  medicalNote: z.string().nullable().optional(),
  icOrPassport: z.string().min(1, "IC/Passport is required").optional(),
})

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Patient: true,
      },
    })

    if (!user || user.role !== "PATIENT" || !user.Patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      profile: user.Patient,
      user: user,
    })
  } catch (error) {
    console.error("Error fetching patient profile:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Patient: true,
      },
    })

    if (!user || user.role !== "PATIENT" || !user.Patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })
    }

    const body = await request.json()
    console.log("Received body:", body) // Debug log

    // Clean the data before validation
    const cleanedData = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === "" ? null : value]),
    )

    console.log("Cleaned data:", cleanedData) // Debug log

    const validatedData = profileUpdateSchema.parse(cleanedData)
    console.log("Validated data:", validatedData) // Debug log

    // Prepare update data with proper type conversion
    const updateData: any = {}

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.age !== undefined) {
      updateData.age = typeof validatedData.age === "string" ? Number.parseInt(validatedData.age) : validatedData.age
    }
    if (validatedData.address !== undefined) updateData.address = validatedData.address
    if (validatedData.gender !== undefined) updateData.gender = validatedData.gender
    if (validatedData.bloodGroup !== undefined) updateData.bloodGroup = validatedData.bloodGroup
    if (validatedData.allergies !== undefined) updateData.allergies = validatedData.allergies
    if (validatedData.medicalNote !== undefined) updateData.medicalNote = validatedData.medicalNote
    if (validatedData.icOrPassport !== undefined) updateData.icOrPassport = validatedData.icOrPassport

    console.log("Update data:", updateData) // Debug log

    const updatedProfile = await prisma.patient.update({
      where: { id: user.Patient.id },
      data: updateData,
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
      user: user,
    })
  } catch (error) {
    console.error("Error updating patient profile:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      console.log("Zod validation error:", error.errors) // Debug log
      return NextResponse.json(
        {
          error: firstError.message,
          field: firstError.path.join("."),
          details: error.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
