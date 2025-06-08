import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const autoBookSchema = z.object({
  clinicId: z.string(),
  symptoms: z.string(),
  urgency: z.enum(["routine", "soon", "urgent"]),
  suggestedDate: z.string(),
})

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { clinicId, symptoms, urgency, suggestedDate } = autoBookSchema.parse(body)

    // Get clinic and a suitable service
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        services: {
          where: { isActive: "ACTIVE" },
          take: 1, // Get first available service
        },
      },
    })

    if (!clinic || clinic.services.length === 0) {
      return NextResponse.json({ error: "Clinic or service not found" }, { status: 404 })
    }

    // Parse suggested date and set time
    const appointmentDate = new Date(suggestedDate)
    appointmentDate.setHours(14, 0, 0, 0) // Set to 2:00 PM

    const endTime = new Date(appointmentDate)
    endTime.setMinutes(endTime.getMinutes() + (clinic.services[0].duration || 30))

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
        serviceId: clinic.services[0].id,
        startTime: appointmentDate,
        endTime: endTime,
        patientDescription: `AI Auto-booked for symptoms: ${symptoms}. Urgency: ${urgency}`,
        status: "BOOKED",
        totalAmount: clinic.services[0].price,
        paymentStatus: "PENDING",
      },
      include: {
        clinic: true,
        service: true,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "APPOINTMENT_CONFIRMED",
        title: "Appointment Booked Successfully",
        message: `Your appointment at ${clinic.name} has been booked for ${appointmentDate.toLocaleDateString()} at 2:00 PM`,
        appointmentId: appointment.id,
      },
    })

    return NextResponse.json({
      message: "Appointment booked successfully",
      appointment: {
        id: appointment.id,
        clinic: appointment.clinic.name,
        service: appointment.service.name,
        date: appointment.startTime.toLocaleDateString(),
        time: appointment.startTime.toLocaleTimeString(),
        cost: appointment.totalAmount,
      },
    })
  } catch (error) {
    console.error("Error in auto booking:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to book appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
