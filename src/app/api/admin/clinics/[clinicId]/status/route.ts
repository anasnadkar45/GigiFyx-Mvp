import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  reason: z.string().optional(),
})

interface RouteParams {
  params: {
    clinicId: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = statusSchema.parse(body)

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: params.clinicId },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    // Update clinic status
    const updatedClinic = await prisma.clinic.update({
      where: { id: params.clinicId },
      data: {
        status: validatedData.status,
        updatedAt: new Date(),
      },
    })

    // Create notification for clinic owner
    const notificationMessage = validatedData.reason
      ? `Your clinic "${clinic.name}" has been ${validatedData.status.toLowerCase()}. Reason: ${validatedData.reason}`
      : `Your clinic "${clinic.name}" has been ${validatedData.status.toLowerCase()}.`

    await prisma.notification.create({
      data: {
        userId: clinic.ownerId,
        type: "CLINIC_UPDATE",
        title: `Clinic Application ${validatedData.status}`,
        message: notificationMessage,
        isRead: false,
      },
    })

    return NextResponse.json({
      message: `Clinic ${validatedData.status.toLowerCase()} successfully`,
      clinic: updatedClinic,
    })
  } catch (error) {
    console.error("Error updating clinic status:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to update clinic status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
