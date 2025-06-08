import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, history } = await request.json()

    // AI responses for clinic management
    const responses = {
      revenue:
        "Based on your clinic data, I recommend increasing cleaning prices by 8% and promoting whitening services to 23 eligible patients. This could boost monthly revenue by RM 4,500.",
      schedule:
        "Your schedule efficiency is 67%. I can optimize it to 89% by redistributing appointments during off-peak hours and adding buffer times.",
      patients:
        "You have 8 high-risk no-show appointments tomorrow. I've automatically sent reminder SMS and emails. Consider calling high-risk patients directly.",
      inventory:
        "Your dental gloves will run out in 3 days. I can auto-order from your preferred supplier. Also, you're overstocking composite resin - reduce next order by 30%.",
      staff:
        "Based on patient flow analysis, add 1 hygienist on Fridays to reduce wait times by 40%. Peak hours are 9-11 AM and 4-6 PM.",
      marketing:
        "15 patients haven't visited in 6+ months. I can send personalized recall messages. Also, 23 patients are due for whitening consultations.",
    }

    // Simple keyword matching for demo
    let response =
      "I'm your AI clinic assistant. I can help with scheduling, revenue optimization, patient management, inventory, staff planning, and marketing insights. What would you like to know?"

    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("revenue") || lowerMessage.includes("money") || lowerMessage.includes("profit")) {
      response = responses.revenue
    } else if (
      lowerMessage.includes("schedule") ||
      lowerMessage.includes("appointment") ||
      lowerMessage.includes("time")
    ) {
      response = responses.schedule
    } else if (
      lowerMessage.includes("patient") ||
      lowerMessage.includes("no-show") ||
      lowerMessage.includes("reminder")
    ) {
      response = responses.patients
    } else if (
      lowerMessage.includes("inventory") ||
      lowerMessage.includes("stock") ||
      lowerMessage.includes("supply")
    ) {
      response = responses.inventory
    } else if (
      lowerMessage.includes("staff") ||
      lowerMessage.includes("hygienist") ||
      lowerMessage.includes("employee")
    ) {
      response = responses.staff
    } else if (
      lowerMessage.includes("marketing") ||
      lowerMessage.includes("recall") ||
      lowerMessage.includes("promotion")
    ) {
      response = responses.marketing
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in AI chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
