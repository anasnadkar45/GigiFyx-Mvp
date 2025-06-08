import { prisma } from "@/app/utils/db"
import { getUserData } from "@/app/utils/hooks"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const bookingSchema = z.object({
  clinicId: z.string().min(1, "Clinic ID is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  patientDescription: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const user = await getUserData()

  if (!user?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Check if user has a patient profile
    const patient = await prisma.patient.findUnique({
      where: {
        userId: user.user.id,
        status: "ACTIVE",
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Active patient profile required. Please complete your profile first." },
        { status: 400 },
      )
    }

    // Verify clinic exists and is approved
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: validatedData.clinicId,
        status: "APPROVED",
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found or not available" }, { status: 404 })
    }

    // Verify service exists and is active
    const service = await prisma.service.findFirst({
      where: {
        id: validatedData.serviceId,
        clinicId: validatedData.clinicId,
        isActive: "ACTIVE",
      },
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found or not available" }, { status: 404 })
    }

    // Validate appointment time is in the future
    const appointmentStart = new Date(validatedData.startTime)
    const appointmentEnd = new Date(validatedData.endTime)
    const now = new Date()

    if (appointmentStart <= now) {
      return NextResponse.json({ error: "Cannot book appointments in the past" }, { status: 400 })
    }

    // Check for conflicting appointments with precise overlap detection
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        clinicId: validatedData.clinicId,
        status: {
          in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"],
        },
        OR: [
          {
            // New appointment starts during existing appointment
            AND: [{ startTime: { lte: appointmentStart } }, { endTime: { gt: appointmentStart } }],
          },
          {
            // New appointment ends during existing appointment
            AND: [{ startTime: { lt: appointmentEnd } }, { endTime: { gte: appointmentEnd } }],
          },
          {
            // New appointment completely contains existing appointment
            AND: [{ startTime: { gte: appointmentStart } }, { endTime: { lte: appointmentEnd } }],
          },
          {
            // Existing appointment completely contains new appointment
            AND: [{ startTime: { lte: appointmentStart } }, { endTime: { gte: appointmentEnd } }],
          },
        ],
      },
    })

    if (conflictingAppointment) {
      return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 })
    }

    // Check if user already has an appointment at this time
    const userConflict = await prisma.appointment.findFirst({
      where: {
        userId: user.user.id,
        status: {
          in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"],
        },
        OR: [
          {
            // New appointment starts during existing appointment
            AND: [{ startTime: { lte: appointmentStart } }, { endTime: { gt: appointmentStart } }],
          },
          {
            // New appointment ends during existing appointment
            AND: [{ startTime: { lt: appointmentEnd } }, { endTime: { gte: appointmentEnd } }],
          },
          {
            // New appointment completely contains existing appointment
            AND: [{ startTime: { gte: appointmentStart } }, { endTime: { lte: appointmentEnd } }],
          },
          {
            // Existing appointment completely contains new appointment
            AND: [{ startTime: { lte: appointmentStart } }, { endTime: { gte: appointmentEnd } }],
          },
        ],
      },
    })

    if (userConflict) {
      return NextResponse.json(
        {
          error: "You already have an appointment scheduled during this time",
        },
        { status: 409 },
      )
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: user.user.id,
        clinicId: validatedData.clinicId,
        serviceId: validatedData.serviceId,
        patientId: patient.id,
        startTime: appointmentStart,
        endTime: appointmentEnd,
        patientDescription: validatedData.patientDescription,
        status: "BOOKED",
        totalAmount: service.price,
        paymentStatus: service.price ? "PENDING" : "PAID",
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            preparation: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create a notification for the appointment
    await prisma.notification.create({
      data: {
        userId: user.user.id,
        type: "APPOINTMENT_CONFIRMED",
        title: "Appointment Booked Successfully",
        message: `Your appointment with ${clinic.name} for ${service.name} has been confirmed for ${appointmentStart.toLocaleString()}.`,
        appointmentId: appointment.id,
      },
    })

    return NextResponse.json({
      message: "Appointment booked successfully",
      appointment,
    })
  } catch (error) {
    console.error("Error booking appointment:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: "This time slot has just been booked by another patient. Please select a different time.",
        },
        { status: 409 },
      )
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
