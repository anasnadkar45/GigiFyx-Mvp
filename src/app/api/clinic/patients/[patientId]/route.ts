import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const updatePatientSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  allergies: z.string().optional(),
  medicalNote: z.string().optional(),
})

interface RouteParams {
  params: {
    patientId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        appointments: {
          where: {
            clinicId: user.clinic.id,
          },
          include: {
            service: {
              select: {
                name: true,
                price: true,
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        treatmentPlans: {
          where: {
            clinicId: user.clinic.id,
          },
          include: {
            creator: {
              select: {
                name: true,
              },
            },
            approver: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            appointments: {
              where: {
                clinicId: user.clinic.id,
              },
            },
            treatmentPlans: {
              where: {
                clinicId: user.clinic.id,
              },
            },
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Check if patient has appointments with this clinic
    const hasAppointments = patient.appointments.length > 0

    if (!hasAppointments) {
      return NextResponse.json({ error: "Patient not associated with this clinic" }, { status: 403 })
    }

    return NextResponse.json({ patient })
  } catch (error) {
    console.error("Error fetching patient details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    const validatedData = updatePatientSchema.parse(body)

    // Verify patient has appointments with this clinic
    const existingPatient = await prisma.patient.findUnique({
      where: { id: params.patientId },
      include: {
        appointments: {
          where: {
            clinicId: user.clinic.id,
          },
        },
      },
    })

    if (!existingPatient || existingPatient.appointments.length === 0) {
      return NextResponse.json({ error: "Patient not found or not associated with this clinic" }, { status: 404 })
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: params.patientId },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      patient: updatedPatient,
      message: "Patient updated successfully",
    })
  } catch (error) {
    console.error("Error updating patient:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
