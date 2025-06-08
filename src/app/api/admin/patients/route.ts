import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { revalidatePath } from "next/cache"
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

    const patients = await prisma.patient.findMany({
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
          select: {
            id: true,
            status: true,
            startTime: true,
            clinic: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    revalidatePath('/admin/patients')

    return NextResponse.json({ patients })
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch patients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
