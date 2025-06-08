import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const doctorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialization: z.string().min(1, "Specialization is required"),
  bio: z.string().optional(),
  experience: z.number().min(0).optional(),
  image: z.string().url().optional().or(z.literal("")),
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
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        clinicId: user.clinic.id,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ doctors })
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch doctors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = doctorSchema.parse(body)

    const doctor = await prisma.doctor.create({
      data: {
        clinicId: user.clinic.id,
        name: validatedData.name,
        specialization: validatedData.specialization,
        bio: validatedData.bio,
        experience: validatedData.experience,
        image: validatedData.image || null,
      },
    })

    return NextResponse.json({
      message: "Doctor added successfully",
      doctor,
    })
  } catch (error) {
    console.error("Error adding doctor:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to add doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
