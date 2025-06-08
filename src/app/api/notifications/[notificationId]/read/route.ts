import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    notificationId: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the notification
    const notification = await prisma.notification.findUnique({
      where: { id: params.notificationId },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Check if the notification belongs to the user
    if (notification.userId !== user.id) {
      return NextResponse.json({ error: "You don't have permission to update this notification" }, { status: 403 })
    }

    // Mark notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id: params.notificationId },
      data: { isRead: true },
    })

    return NextResponse.json({
      message: "Notification marked as read",
      notification: updatedNotification,
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json(
      {
        error: "Failed to mark notification as read",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
