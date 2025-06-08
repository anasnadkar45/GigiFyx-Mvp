import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: {
          include: {
            services: {
              select: {
                id: true,
                name: true,
                category: true,
                isActive: true,
              },
            },
            _count: {
              select: {
                appointments: true,
                reviews: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get notifications related to clinic status
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: "CLINIC_UPDATE",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      clinic: user.clinic,
      notifications,
      hasClinic: !!user.clinic,
    })
  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
