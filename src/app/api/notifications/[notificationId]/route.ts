import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    notificationId: string
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
      return NextResponse.json({ error: "You don't have permission to delete this notification" }, { status: 403 })
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: params.notificationId },
    })

    return NextResponse.json({
      message: "Notification deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      {
        error: "Failed to delete notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
