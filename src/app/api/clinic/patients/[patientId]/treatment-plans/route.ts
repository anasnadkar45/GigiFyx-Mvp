import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const treatmentPlanSchema = z.object({
  diagnosis: z.string().min(1, "Diagnosis is required"),
  symptoms: z.string().min(1, "Symptoms are required"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
  aiGeneratedPlan: z.string().min(1, "Treatment plan is required"),
})

interface RouteParams {
  params: {
    patientId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { diagnosis, symptoms, urgency, aiGeneratedPlan } = treatmentPlanSchema.parse(body)

    // Verify patient exists and has appointments with this clinic
    const patient = await prisma.patient.findUnique({
      where: { id: params.patientId },
      include: {
        appointments: {
          where: {
            clinicId: user.clinic.id,
          },
        },
      },
    })

    if (!patient || patient.appointments.length === 0) {
      return NextResponse.json({ error: "Patient not found or not associated with this clinic" }, { status: 404 })
    }

    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        patientId: params.patientId,
        clinicId: user.clinic.id,
        createdBy: user.id,
        diagnosis,
        symptoms,
        urgency,
        aiGeneratedPlan,
        status: "DRAFT",
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
        patient: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      treatmentPlan,
      message: "Treatment plan created successfully",
    })
  } catch (error) {
    console.error("Error creating treatment plan:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where: {
        patientId: params.patientId,
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
    })

    return NextResponse.json({ treatmentPlans })
  } catch (error) {
    console.error("Error fetching treatment plans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
