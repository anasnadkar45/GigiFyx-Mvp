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
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    // Calculate appointment statistics
    const completedAppointments = appointments.filter((a) => a.status === "COMPLETED")
    const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED")
    const noShowAppointments = appointments.filter((a) => a.status === "NO_SHOW")

    // Calculate revenue
    const totalRevenue = completedAppointments.reduce((sum, apt) => {
      return sum + (apt.totalAmount || apt.service.price || 0)
    }, 0)

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

    // This is a simplified version that returns JSON
    // In a real implementation, you would generate a PDF or Excel file
    return NextResponse.json({
      reportType: "Analytics Report",
      clinicName: user.clinic.name,
      period: `Last ${days} days (${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()})`,
      summary: {
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: cancelledAppointments.length,
        noShowAppointments: noShowAppointments.length,
        totalRevenue: totalRevenue,
        averageRevenuePerAppointment:
          completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0,
      },
      topServices: popularServices.slice(0, 5),
      appointmentsByDay: appointments.reduce(
        (acc, apt) => {
          const day = apt.startTime.toISOString().split("T")[0]
          if (!acc[day]) acc[day] = 0
          acc[day]++
          return acc
        },
        {} as Record<string, number>,
      ),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating analytics report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
