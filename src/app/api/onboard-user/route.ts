import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schemas
const patientSchema = z.object({
  role: z.literal("PATIENT"),
  age: z.string().transform((val) => {
    const num = Number.parseInt(val)
    if (isNaN(num) || num < 0 || num > 150) {
      throw new Error("Invalid age")
    }
    return num
  }),
  icOrPassport: z.string().min(1, "IC/Passport is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalNote: z.string().optional(),
})

const clinicSchema = z.object({
  role: z.literal("CLINIC_OWNER"),
  clinicName: z.string().min(1, "Clinic name is required"),
  clinicAddress: z.string().min(1, "Clinic address is required"),
  clinicPhone: z.string().min(1, "Clinic phone is required"),
  description: z.string().min(10, "Description is required"),
  documents: z.array(z.string(), { message: "Minimum 1 file is required" }),
})

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log("Received data:", body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate based on role
    let validatedData
    if (body.role === "PATIENT") {
      validatedData = patientSchema.parse(body)
    } else if (body.role === "CLINIC_OWNER") {
      validatedData = clinicSchema.parse(body)
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: validatedData.role },
    })

    // Onboard as patient
    if (validatedData.role === "PATIENT") {
      // Check if IC/Passport already exists
      const existingPatient = await prisma.patient.findUnique({
        where: { icOrPassport: validatedData.icOrPassport },
      })

      if (existingPatient) {
        return NextResponse.json({ error: "IC/Passport number already registered" }, { status: 400 })
      }

      await prisma.patient.create({
        data: {
          userId: updatedUser.id,
          name: updatedUser.name ?? "",
          icOrPassport: validatedData.icOrPassport,
          phone: validatedData.phone,
          age: validatedData.age,
          email: updatedUser.email,
          address: validatedData.address,
          gender: validatedData.gender,
          bloodGroup: validatedData.bloodGroup || null,
          allergies: validatedData.allergies || null,
          medicalNote: validatedData.medicalNote || null,
        },
      })
    }

    // Onboard as clinic owner
    if (validatedData.role === "CLINIC_OWNER") {
      const documents = Array.isArray(validatedData.documents) ? validatedData.documents : []
      await prisma.clinic.create({
        data: {
          ownerId: updatedUser.id,
          name: validatedData.clinicName,
          address: validatedData.clinicAddress,
          phone: validatedData.clinicPhone,
          description: validatedData.description,
          documents: documents,
          status: "PENDING",
        },
      })
    }

    return NextResponse.json({ message: "User onboarded successfully" })
  } catch (error) {
    console.error("Detailed onboarding error:", error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    // Handle Prisma unique constraint violations
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      if (error.message.includes("icOrPassport")) {
        return NextResponse.json({ error: "IC/Passport number already registered" }, { status: 400 })
      }
      return NextResponse.json({ error: "A record with this information already exists" }, { status: 400 })
    }

    // Handle other Prisma errors
    if (error instanceof Error && error.message.includes("Invalid")) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Something went wrong during onboarding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
