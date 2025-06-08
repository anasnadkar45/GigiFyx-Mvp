import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Calendar, CheckCircle, Info } from "lucide-react"
import { NotificationList } from "@/components/patient/notification-list"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || user.role !== "PATIENT") {
    redirect("/")
  }

  // Get notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Group notifications by type
  const appointmentNotifications = notifications.filter(
    (n) =>
      n.type === "APPOINTMENT_REMINDER" ||
      n.type === "APPOINTMENT_CONFIRMED" ||
      n.type === "APPOINTMENT_CANCELLED" ||
      n.type === "APPOINTMENT_RESCHEDULED",
  )

  const systemNotifications = notifications.filter(
    (n) => n.type === "SYSTEM_NOTIFICATION" || n.type === "CLINIC_UPDATE",
  )

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <>

      <Topbar>
        <TopbarContent>
          <TopbarTitle>Notifications</TopbarTitle>
          <TopbarDescription>Stay updated with your appointments and clinic information</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          {unreadCount > 0 && (
            <Button variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </TopbarAction>
      </Topbar>

      <Wrapper>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All
              {unreadCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You don't have any notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              <NotificationList notifications={notifications} />
            )}
          </TabsContent>

          <TabsContent value="appointments">
            {appointmentNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No appointment notifications</p>
                </CardContent>
              </Card>
            ) : (
              <NotificationList notifications={appointmentNotifications} />
            )}
          </TabsContent>

          <TabsContent value="system">
            {systemNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No system notifications</p>
                </CardContent>
              </Card>
            ) : (
              <NotificationList notifications={systemNotifications} />
            )}
          </TabsContent>
        </Tabs>
      </Wrapper>
    </>
  )
}
