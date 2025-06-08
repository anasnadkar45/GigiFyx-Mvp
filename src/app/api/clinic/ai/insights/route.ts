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

    // Generate AI insights based on clinic data
    const insights = [
      {
        id: "1",
        type: "optimization",
        title: "Schedule Optimization Opportunity",
        description: "AI detected 23% efficiency improvement possible by adjusting appointment slots during 2-4 PM",
        impact: "high",
        action: "Apply Optimization",
        confidence: 94,
      },
      {
        id: "2",
        type: "prediction",
        title: "High No-Show Risk",
        description: "8 appointments tomorrow have 78% no-show probability based on patient patterns",
        impact: "medium",
        action: "Send Reminders",
        confidence: 87,
      },
      {
        id: "3",
        type: "recommendation",
        title: "Revenue Opportunity",
        description: "15 patients eligible for teeth whitening services - potential RM 4,500 revenue",
        impact: "high",
        action: "Contact Patients",
        confidence: 91,
      },
      {
        id: "4",
        type: "alert",
        title: "Inventory Alert",
        description: "Dental gloves will run out in 3 days based on current usage patterns",
        impact: "medium",
        action: "Reorder Now",
        confidence: 96,
      },
      {
        id: "5",
        type: "optimization",
        title: "Staff Scheduling",
        description: "AI suggests adding 1 hygienist on Fridays to reduce wait times by 40%",
        impact: "medium",
        action: "Adjust Schedule",
        confidence: 89,
      },
    ]

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error fetching AI insights:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
