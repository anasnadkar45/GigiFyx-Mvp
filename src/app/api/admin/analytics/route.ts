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
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get current date for time-based queries
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Basic counts
    const totalClinics = await prisma.clinic.count()
    const approvedClinics = await prisma.clinic.count({ where: { status: "APPROVED" } })
    const pendingClinics = await prisma.clinic.count({ where: { status: "PENDING" } })
    const rejectedClinics = await prisma.clinic.count({ where: { status: "REJECTED" } })

    const totalPatients = await prisma.patient.count()
    const totalAppointments = await prisma.appointment.count()
    const completedAppointments = await prisma.appointment.count({ where: { status: "COMPLETED" } })

    // Recent activity
    const newClinicsThisWeek = await prisma.clinic.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })
    const newPatientsThisWeek = await prisma.patient.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })
    const appointmentsThisWeek = await prisma.appointment.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    // Revenue calculation (from completed appointments)
    const revenueData = await prisma.appointment.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        totalAmount: true,
      },
    })

    // Monthly growth data
    const monthlyData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as appointments,
        SUM(CASE WHEN status = 'COMPLETED' THEN "totalAmount" ELSE 0 END) as revenue
      FROM "Appointment"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `

    // Top performing clinics
    const topClinics = await prisma.clinic.findMany({
      where: { status: "APPROVED" },
      include: {
        _count: {
          select: {
            appointments: true,
            reviews: true,
          },
        },
        appointments: {
          where: { status: "COMPLETED" },
          select: { totalAmount: true },
        },
      },
      orderBy: {
        appointments: {
          _count: "desc",
        },
      },
      take: 5,
    })

    return NextResponse.json({
      overview: {
        totalClinics,
        approvedClinics,
        pendingClinics,
        rejectedClinics,
        totalPatients,
        totalAppointments,
        completedAppointments,
        totalRevenue: revenueData._sum.totalAmount || 0,
      },
      recentActivity: {
        newClinicsThisWeek,
        newPatientsThisWeek,
        appointmentsThisWeek,
      },
      monthlyData,
      topClinics: topClinics.map((clinic) => ({
        id: clinic.id,
        name: clinic.name,
        appointmentCount: clinic._count.appointments,
        reviewCount: clinic._count.reviews,
        revenue: clinic.appointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0),
      })),
    })
  } catch (error) {
    console.error("Error fetching admin analytics:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
