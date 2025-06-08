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
      include: { clinic: true },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    // AI-generated schedule optimization data
    const optimization = {
      currentEfficiency: 67,
      optimizedEfficiency: 89,
      suggestions: [
        "Move 3 cleaning appointments from 10 AM to 2 PM slot for better flow",
        "Add 30-minute buffer between complex procedures",
        "Schedule routine checkups during off-peak hours (1-3 PM)",
        "Group similar procedures to reduce setup time",
        "Reserve emergency slots during peak hours (9-11 AM, 4-6 PM)",
      ],
      timeSlots: [
        { time: "9:00 AM", current: 85, optimized: 95, improvement: 10 },
        { time: "10:00 AM", current: 95, optimized: 90, improvement: -5 },
        { time: "11:00 AM", current: 90, optimized: 95, improvement: 5 },
        { time: "2:00 PM", current: 45, optimized: 75, improvement: 30 },
        { time: "3:00 PM", current: 50, optimized: 80, improvement: 30 },
        { time: "4:00 PM", current: 80, optimized: 90, improvement: 10 },
      ],
    }

    return NextResponse.json(optimization)
  } catch (error) {
    console.error("Error fetching schedule optimization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
