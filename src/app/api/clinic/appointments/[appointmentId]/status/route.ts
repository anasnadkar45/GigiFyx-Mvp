import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const statusSchema = z.object({
  status: z.enum(["BOOKED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]),
})

interface RouteParams {
  params: {
    appointmentId: string
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
      include: {
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = statusSchema.parse(body)

    // Check if appointment exists and belongs to this clinic
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        clinic: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    if (appointment.clinicId !== user.clinic.id) {
      return NextResponse.json({ error: "This appointment does not belong to your clinic" }, { status: 403 })
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.appointmentId },
      data: {
        status: validatedData.status,
      },
    })

    // Create notification for the patient
    let notificationType:
      | "APPOINTMENT_REMINDER"
      | "APPOINTMENT_CONFIRMED"
      | "APPOINTMENT_CANCELLED"
      | "APPOINTMENT_RESCHEDULED"
      | "CLINIC_UPDATE"
      | "SYSTEM_NOTIFICATION" = "SYSTEM_NOTIFICATION"
    let notificationTitle = ""
    let notificationMessage = ""

    switch (validatedData.status) {
      case "CONFIRMED":
        notificationType = "APPOINTMENT_CONFIRMED"
        notificationTitle = "Appointment Confirmed"
        notificationMessage = `Your appointment with ${appointment.clinic.name} for ${appointment.service.name} has been confirmed.`
        break
      case "CANCELLED":
        notificationType = "APPOINTMENT_CANCELLED"
        notificationTitle = "Appointment Cancelled"
        notificationMessage = `Your appointment with ${appointment.clinic.name} for ${appointment.service.name} has been cancelled.`
        break
      case "COMPLETED":
        notificationType = "SYSTEM_NOTIFICATION"
        notificationTitle = "Appointment Completed"
        notificationMessage = `Your appointment with ${appointment.clinic.name} for ${appointment.service.name} has been marked as completed.`
        break
      case "IN_PROGRESS":
        notificationType = "SYSTEM_NOTIFICATION"
        notificationTitle = "Appointment Started"
        notificationMessage = `Your appointment with ${appointment.clinic.name} for ${appointment.service.name} is now in progress.`
        break
      case "NO_SHOW":
        notificationType = "SYSTEM_NOTIFICATION"
        notificationTitle = "Missed Appointment"
        notificationMessage = `You missed your appointment with ${appointment.clinic.name} for ${appointment.service.name}.`
        break
    }

    if (notificationTitle) {
      await prisma.notification.create({
        data: {
          userId: appointment.userId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          appointmentId: appointment.id,
        },
      })
    }

    revalidatePath('/clinic/appointments');

    return NextResponse.json({
      message: `Appointment status updated to ${validatedData.status.toLowerCase()}`,
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error("Error updating appointment status:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to update appointment status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
