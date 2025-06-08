import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, DollarSign, TrendingUp, Clock, Star } from "lucide-react"
import Link from "next/link"
import { getUserData } from "@/app/utils/hooks"
import { prisma } from "@/app/utils/db"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

export default async function ClinicDashboard() {
  const user = await getUserData()

  if (!user.user?.clinic) {
    return <div>Clinic not found</div>
  }

  // Fetch today's appointments
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      clinicId: user.user.clinic.id,
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  })

  // Fetch upcoming appointments
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      clinicId: user.user.clinic.id,
      startTime: {
        gte: new Date(),
      },
      status: {
        in: ["BOOKED", "CONFIRMED"],
      },
    },
    take: 5,
    orderBy: {
      startTime: "asc",
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
  })

  // Fetch monthly stats
  const thisMonth = new Date()
  const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)

  const monthlyStats = await prisma.appointment.aggregate({
    where: {
      clinicId: user.user.clinic.id,
      startTime: {
        gte: startOfMonth,
      },
      status: "COMPLETED",
    },
    _count: {
      id: true,
    },
    _sum: {
      totalAmount: true,
    },
  })

  const totalPatients = await prisma.appointment.findMany({
    where: {
      clinicId: user.user.clinic.id,
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  })

  return (
    <>
      {/* Welcome Section */}
      <Topbar>
        <TopbarContent>
          <TopbarTitle>Welcome back, {user.user.clinic.name}!</TopbarTitle>
          <TopbarDescription>Manage your clinic operations and appointments</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <div className="flex flex-col md:flex-row gap-2">
            <Link href="/clinic/calendar">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link href="/clinic/services">
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                Manage Services
              </Button>
            </Link>
          </div>
        </TopbarAction>
      </Topbar>

      <Wrapper className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {todayAppointments.filter((a) => a.status === "COMPLETED").length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatients.length}</div>
              <p className="text-xs text-muted-foreground">unique patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM {monthlyStats._sum.totalAmount?.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-muted-foreground">{monthlyStats._count.id} appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clinic Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs text-muted-foreground">average rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </div>
              <Link href="/clinic/appointments">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{appointment.user.name}</h3>
                        <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(appointment.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        appointment.status === "COMPLETED"
                          ? "default"
                          : appointment.status === "CONFIRMED"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Next scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{appointment.user.name}</h3>
                        <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                          {new Date(appointment.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{appointment.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Wrapper>
    </>
  )
}
