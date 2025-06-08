"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Calendar, CheckCircle, Clock, Info, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  appointmentId?: string | null
}

interface NotificationListProps {
  notifications: Notification[]
}

export function NotificationList({ notifications }: NotificationListProps) {
  const [notificationList, setNotificationList] = useState(notifications)

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }

      setNotificationList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to update notification")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete notification")
      }

      setNotificationList((prev) => prev.filter((n) => n.id !== id))
      toast.success("Notification deleted")
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "APPOINTMENT_REMINDER":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "APPOINTMENT_CONFIRMED":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "APPOINTMENT_CANCELLED":
        return <Calendar className="h-5 w-5 text-red-500" />
      case "APPOINTMENT_RESCHEDULED":
        return <Calendar className="h-5 w-5 text-amber-500" />
      case "CLINIC_UPDATE":
        return <Info className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {notificationList.map((notification) => (
        <Card key={notification.id} className={notification.isRead ? "bg-background" : "bg-primary/5"}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="mt-1">{getIcon(notification.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>

                <div className="flex justify-end gap-2 mt-2">
                  {!notification.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as read
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
