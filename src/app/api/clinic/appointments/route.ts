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
      include: {
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    // Add console.log for debugging
    console.log("Fetching appointments for clinic:", user.clinic.id)

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: user.clinic.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            duration: true,
            preparation: true,
          },
        },
        // doctor: {
        //   select: {
        //     id: true,
        //     name: true,
        //     specialization: true,
        //   },
        // },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    // Add console.log for debugging
    console.log(`Found ${appointments.length} appointments`)

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
