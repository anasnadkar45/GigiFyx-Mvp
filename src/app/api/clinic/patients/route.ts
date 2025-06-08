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
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "ALL"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where clause for patients who have appointments with this clinic
    const whereClause: any = {
      appointments: {
        some: {
          clinicId: user.clinic.id,
        },
      },
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { icOrPassport: { contains: search, mode: "insensitive" } },
      ]
    }

    // Add status filter
    if (status !== "ALL") {
      whereClause.status = status
    }

    // Get patients with pagination
    const [patients, totalCount] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
          appointments: {
            where: {
              clinicId: user.clinic.id,
            },
            include: {
              service: {
                select: {
                  name: true,
                  price: true,
                  category: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          },
          treatmentPlans: {
            where: {
              clinicId: user.clinic.id,
            },
            include: {
              creator: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 3,
          },
          _count: {
            select: {
              appointments: {
                where: {
                  clinicId: user.clinic.id,
                },
              },
              treatmentPlans: {
                where: {
                  clinicId: user.clinic.id,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.patient.count({
        where: whereClause,
      }),
    ])

    // Calculate additional statistics
    const stats = await prisma.patient.groupBy({
      by: ["status"],
      where: {
        appointments: {
          some: {
            clinicId: user.clinic.id,
          },
        },
      },
      _count: {
        id: true,
      },
    })

    const statusStats = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      },
      { ACTIVE: 0, INACTIVE: 0, SUSPENDED: 0 } as Record<string, number>,
    )

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: statusStats,
    })
  } catch (error) {
    console.error("Error fetching clinic patients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
