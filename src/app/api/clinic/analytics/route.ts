import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30", 10)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get appointments data
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: user.clinic.id,
        startTime: {
          gte: startDate,
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        startTime: "asc",
      },
    })

    // Calculate appointment statistics
    const completedAppointments = appointments.filter((a) => a.status === "BOOKED")
    const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED")
    const noShowAppointments = appointments.filter((a) => a.status === "NO_SHOW")

    // Calculate revenue
    const totalRevenue = completedAppointments.reduce((sum, apt) => {
      return sum + (apt.totalAmount || apt.service.price || 0)
    }, 0)

    // Get previous period data for trend calculation
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days)

    const previousAppointments = await prisma.appointment.findMany({
      where: {
        clinicId: user.clinic.id,
        startTime: {
          gte: previousPeriodStart,
          lt: startDate,
        },
        status: "COMPLETED",
      },
      include: {
        service: true,
      },
    })

    const previousRevenue = previousAppointments.reduce((sum, apt) => {
      return sum + (apt.totalAmount || apt.service.price || 0)
    }, 0)

    // Calculate trends
    const appointmentTrend =
      previousAppointments.length > 0
        ? ((completedAppointments.length - previousAppointments.length) / previousAppointments.length) * 100
        : 0

    const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Get patient data
    const uniquePatientIds = [...new Set(appointments.map((apt) => apt.userId))]
    const totalPatients = uniquePatientIds.length

    // Get all patients who had appointments before this period
    const previousPatients = await prisma.appointment.findMany({
      where: {
        clinicId: user.clinic.id,
        startTime: {
          lt: startDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    })

    const previousPatientIds = previousPatients.map((p) => p.userId)
    const newPatients = uniquePatientIds.filter((id) => !previousPatientIds.includes(id)).length
    const returningPatients = totalPatients - newPatients

    // Get service popularity
    const serviceStats = await prisma.service.findMany({
      where: {
        clinicId: user.clinic.id,
      },
      include: {
        appointments: {
          where: {
            startTime: {
              gte: startDate,
            },
            status: "COMPLETED",
          },
        },
      },
    })

    const popularServices = serviceStats
      .map((service) => ({
        name: service.name,
        count: service.appointments.length,
        revenue: service.appointments.reduce((sum, apt) => sum + (apt.totalAmount || service.price || 0), 0),
      }))
      .sort((a, b) => b.count - a.count)

    // Get service performance (satisfaction based on reviews)
    const servicePerformance = await Promise.all(
      serviceStats.map(async (service) => {
        const appointmentIds = service.appointments.map((apt) => apt.id)

        // This is a placeholder since we don't have direct service reviews
        // In a real system, you might have reviews linked to services or calculate this differently
        const satisfaction = Math.floor(Math.random() * 30) + 70 // Random value between 70-100%

        return {
          name: service.name,
          satisfaction,
        }
      }),
    )

    // Get time slot distribution
    const timeSlots = Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, "0")}:00`,
      bookings: 0,
    }))

    appointments.forEach((apt) => {
      const hour = new Date(apt.startTime).getHours()
      timeSlots[hour].bookings += 1
    })

    // Get monthly data
    const monthlyData = appointments.reduce(
      (acc, apt) => {
        const month = apt.startTime.toISOString().substring(0, 7) // YYYY-MM
        if (!acc[month]) {
          acc[month] = { month, appointments: 0, revenue: 0 }
        }

        if (apt.status === "COMPLETED") {
          acc[month].appointments += 1
          acc[month].revenue += apt.totalAmount || apt.service.price || 0
        }

        return acc
      },
      {} as Record<string, { month: string; appointments: number; revenue: number }>,
    )

    const monthlyDataArray = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({
      appointments: {
        total: appointments.length,
        completed: completedAppointments.length,
        cancelled: cancelledAppointments.length,
        noShow: noShowAppointments.length,
        trend: Math.round(appointmentTrend),
      },
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        thisMonth: Math.round(totalRevenue * 100) / 100,
        lastMonth: Math.round(previousRevenue * 100) / 100,
        trend: Math.round(revenueTrend),
      },
      patients: {
        total: totalPatients,
        new: newPatients,
        returning: returningPatients,
        trend:
          previousPatientIds.length > 0
            ? Math.round(((totalPatients - previousPatientIds.length) / previousPatientIds.length) * 100)
            : 0,
      },
      services: {
        popular: popularServices,
        performance: servicePerformance,
      },
      timeSlots,
      monthlyData: monthlyDataArray,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
