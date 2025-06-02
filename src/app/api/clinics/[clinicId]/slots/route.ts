import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { format, startOfDay, endOfDay, parseISO, addMinutes, isAfter } from "date-fns"

interface RouteParams {
  params: {
    clinicId: string
  }
}

// GET - Fetch available time slots for a clinic
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    const serviceId = searchParams.get("serviceId")

    if (!dateParam) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
    }

    const requestedDate = parseISO(dateParam)
    const dayOfWeek = format(requestedDate, "EEEE").toUpperCase()

    // Verify clinic exists and is approved
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: params.clinicId,
        status: "APPROVED",
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found or not available" }, { status: 404 })
    }

    // Get clinic working hours for the requested day
    const workingHours = await prisma.clinicWorkingHours.findFirst({
      where: {
        clinicId: params.clinicId,
        day: dayOfWeek as any,
      },
    })

    if (!workingHours) {
      return NextResponse.json({
        slots: [],
        bookedSlots: [],
        message: `${clinic.name} is closed on ${format(requestedDate, "EEEE")}s`,
      })
    }

    // Get service details if serviceId is provided
    let serviceDuration = workingHours.duration // Default to clinic's default duration
    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          clinicId: params.clinicId,
          isActive: "ACTIVE",
        },
      })

      // Only use service duration if it's set and is a multiple of working hours duration
      if (service && service.duration) {
        // Ensure service duration is compatible with working hours interval
        if (service.duration >= workingHours.duration && service.duration % workingHours.duration === 0) {
          serviceDuration = service.duration
        }
      }
    }

    // Get existing appointments for the day
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId: params.clinicId,
        startTime: {
          gte: startOfDay(requestedDate),
          lte: endOfDay(requestedDate),
        },
        status: {
          in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"],
        },
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
    })

    // Generate all possible time slots and mark them as available or booked
    const { availableSlots, bookedSlots } = generateTimeSlots(
      workingHours,
      requestedDate,
      existingAppointments,
      serviceDuration,
    )

    return NextResponse.json({
      slots: availableSlots,
      bookedSlots: bookedSlots,
      workingHours: {
        openTime: workingHours.openTime,
        closeTime: workingHours.closeTime,
        breakStartTime: workingHours.breakStartTime,
        breakEndTime: workingHours.breakEndTime,
      },
      serviceDuration,
    })
  } catch (error) {
    console.error("Error fetching slots:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch available slots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateTimeSlots(workingHours: any, date: Date, existingAppointments: any[], serviceDuration: number) {
  const availableSlots = []
  const bookedSlots = []

  const [openHour, openMin] = workingHours.openTime.split(":").map(Number)
  const [closeHour, closeMin] = workingHours.closeTime.split(":").map(Number)

  const startTime = new Date(date)
  startTime.setHours(openHour, openMin, 0, 0)

  const endTime = new Date(date)
  endTime.setHours(closeHour, closeMin, 0, 0)

  let currentTime = new Date(startTime)
  const now = new Date()

  // Use the working hours duration for consistent slot intervals
  const slotInterval = workingHours.duration

  while (currentTime < endTime) {
    const slotEndTime = addMinutes(currentTime, serviceDuration)

    // Skip if slot would extend beyond closing time
    if (slotEndTime > endTime) {
      break
    }

    // Skip if slot is during break time
    if (workingHours.breakStartTime && workingHours.breakEndTime) {
      const [breakStartHour, breakStartMin] = workingHours.breakStartTime.split(":").map(Number)
      const [breakEndHour, breakEndMin] = workingHours.breakEndTime.split(":").map(Number)

      const breakStart = new Date(date)
      breakStart.setHours(breakStartHour, breakStartMin, 0, 0)

      const breakEnd = new Date(date)
      breakEnd.setHours(breakEndHour, breakEndMin, 0, 0)

      // Skip if slot overlaps with break time
      if (currentTime < breakEnd && slotEndTime > breakStart) {
        currentTime = addMinutes(currentTime, slotInterval)
        continue
      }
    }

    // Check if this slot conflicts with existing appointments
    const conflictingAppointment = existingAppointments.find((appointment) => {
      const appointmentStart = new Date(appointment.startTime)
      const appointmentEnd = new Date(appointment.endTime)

      // Convert to timestamps for precise comparison
      const slotStart = currentTime.getTime()
      const slotEnd = slotEndTime.getTime()
      const apptStart = appointmentStart.getTime()
      const apptEnd = appointmentEnd.getTime()

      // Two time slots overlap if:
      // - Slot starts before appointment ends AND
      // - Slot ends after appointment starts
      // BUT we need to exclude exact boundary matches (touching but not overlapping)
      const hasOverlap = slotStart < apptEnd && slotEnd > apptStart

      // Additional check: if they just touch at boundaries, it's not a conflict
      const justTouching = slotStart === apptEnd || slotEnd === apptStart

      return hasOverlap && !justTouching
    })

    // Only include future slots (not past slots for today)
    const isInFuture = isAfter(currentTime, now)

    if (isInFuture) {
      const slot = {
        startTime: currentTime.toISOString(),
        endTime: slotEndTime.toISOString(),
        available: !conflictingAppointment,
      }

      if (conflictingAppointment) {
        bookedSlots.push(slot)
      } else {
        availableSlots.push(slot)
      }
    }

    // Move to next time slot using the working hours duration interval
    currentTime = addMinutes(currentTime, slotInterval)
  }

  return { availableSlots, bookedSlots }
}
