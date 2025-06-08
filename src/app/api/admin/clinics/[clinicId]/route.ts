import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    clinicId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const clinic = await prisma.clinic.findUnique({
      where: { id: params.clinicId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            isActive: true,
          },
        },
        appointments: {
          select: {
            id: true,
            status: true,
            startTime: true,
          },
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            appointments: true,
            services: true,
            reviews: true,
          },
        },
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    return NextResponse.json({ clinic })
  } catch (error) {
    console.error("Error fetching clinic details:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch clinic details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
