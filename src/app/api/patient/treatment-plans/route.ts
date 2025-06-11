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
        Patient: true,
      },
    })

    if (!user || user.role !== "PATIENT" || !user.Patient) {
      return NextResponse.json({ error: "Patient access required" }, { status: 403 })
    }

    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where: {
        patientId: user.Patient.id,
        sharedWithPatient: true,
      },
      include: {
        clinic: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
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
        sharedAt: "desc",
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
        sharedAt: plan.sharedAt,
        approvedAt: plan.approvedAt,
        clinic: plan.clinic,
        creator: plan.creator,
        approver: plan.approver,
        aiGeneratedPlan: JSON.parse(plan.aiGeneratedPlan),
      })),
    })
  } catch (error) {
    console.error("Error fetching patient treatment plans:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch treatment plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
