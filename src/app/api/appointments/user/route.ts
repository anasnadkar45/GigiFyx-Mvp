import { prisma } from "@/app/utils/db"
import { getUserData } from "@/app/utils/hooks"
import { NextResponse } from "next/server"

// GET - Fetch user's appointments
export async function GET() {
  const user = await getUserData()

  if (!user?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: user.user.id,
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
            image: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Error fetching user appointments:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
