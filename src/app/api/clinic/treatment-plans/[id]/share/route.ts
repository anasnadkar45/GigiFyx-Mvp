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
        patient: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!treatmentPlan) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 })
    }

    if (treatmentPlan.clinicId !== user.clinic.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update the treatment plan to mark it as shared
    const updatedPlan = await prisma.treatmentPlan.update({
      where: {
        id: params.id,
      },
      data: {
        sharedWithPatient: true,
        sharedAt: new Date(),
      },
    })

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: treatmentPlan.patient.userId,
        type: "TREATMENT_PLAN",
        title: "New Treatment Plan Available",
        message: `Your dentist has shared a new treatment plan for ${treatmentPlan.diagnosis}. View it in your dashboard.`,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Treatment plan shared with patient successfully",
      plan: updatedPlan,
    })
  } catch (error) {
    console.error("Error sharing treatment plan:", error)
    return NextResponse.json(
      {
        error: "Failed to share treatment plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
