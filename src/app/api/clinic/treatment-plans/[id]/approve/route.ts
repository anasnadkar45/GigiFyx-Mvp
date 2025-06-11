import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: {
        id: params.id,
      },
      include: {
        patient: true,
      },
    })

    if (!treatmentPlan) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 })
    }

    if (treatmentPlan.clinicId !== user.clinic.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updatedPlan = await prisma.treatmentPlan.update({
      where: {
        id: params.id,
      },
      data: {
        status: "APPROVED",
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    })

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: treatmentPlan.patient.userId,
        type: "AI_RECOMMENDATION",
        title: "Treatment Plan Approved",
        message: `Your treatment plan for ${treatmentPlan.diagnosis} has been approved by your dentist.`,
      },
    })

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
    })
  } catch (error) {
    console.error("Error approving treatment plan:", error)
    return NextResponse.json(
      {
        error: "Failed to approve treatment plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
