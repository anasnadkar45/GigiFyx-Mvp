import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"

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

    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where: {
        clinicId: user.clinic.id,
      },
      include: {
        patient: true,
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      plans: treatmentPlans.map((plan) => ({
        id: plan.id,
        diagnosis: plan.diagnosis,
        symptoms: plan.symptoms,
        urgency: plan.urgency,
        status: plan.status,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        approvedAt: plan.approvedAt,
        patient: {
          id: plan.patient.id,
          name: plan.patient.name,
          age: plan.patient.age,
          gender: plan.patient.gender,
        },
        creator: plan.creator,
        approver: plan.approver,
        aiGeneratedPlan: JSON.parse(plan.aiGeneratedPlan),
      })),
    })
  } catch (error) {
    console.error("Error fetching treatment plans:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch treatment plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
