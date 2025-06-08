import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    patientId: string
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

    const patient = await prisma.patient.findUnique({
      where: { id: params.patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        appointments: {
          include: {
            clinic: {
              select: {
                name: true,
              },
            },
            service: {
              select: {
                name: true,
                price: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        reviews: {
          include: {
            clinic: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            appointments: true,
            reviews: true,
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    return NextResponse.json({ patient })
  } catch (error) {
    console.error("Error fetching patient details:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch patient details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const patient = await prisma.patient.findUnique({
      where: { id: params.patientId },
      include: {
        user: true,
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Delete patient and associated user
    await prisma.patient.delete({
      where: { id: params.patientId },
    })

    await prisma.user.delete({
      where: { id: patient.userId },
    })

    return NextResponse.json({ message: "Patient deleted successfully" })
  } catch (error) {
    console.error("Error deleting patient:", error)
    return NextResponse.json(
      {
        error: "Failed to delete patient",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
