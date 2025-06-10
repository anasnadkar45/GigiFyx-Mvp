import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Star, Plus } from "lucide-react"
import Link from "next/link"
import { getUserData } from "@/app/utils/hooks"
import { prisma } from "@/app/utils/db"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

export default async function PatientDashboard() {
  const user = await getUserData()

  // Fetch upcoming appointments
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      userId: user.user?.id,
      startTime: {
        gte: new Date(),
      },
      status: {
        in: ["BOOKED", "CONFIRMED"],
      },
    },
    include: {
      clinic: {
        select: {
          name: true,
          address: true,
        },
      },
      service: {
        select: {
          name: true,
          category: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
    take: 3,
  })

  // Fetch recent appointments
  const recentAppointments = await prisma.appointment.findMany({
    where: {
      userId: user.user?.id,
      status: "COMPLETED",
    },
    include: {
      clinic: {
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
      startTime: "desc",
    },
    take: 3,
  })

  return (
    <>
      {/* Welcome Section */}
      <Topbar>
        <TopbarContent>
          <TopbarTitle>Welcome back, {user.user?.name}!</TopbarTitle>
          <TopbarDescription>Manage your dental appointments and health</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <Link href="/patient/search">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        </TopbarAction>
      </Topbar>

      <Wrapper className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentAppointments.length}</div>
              <p className="text-xs text-muted-foreground">this year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clinics Visited</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(recentAppointments.map((a) => a.clinic.name)).size}</div>
              <p className="text-xs text-muted-foreground">different clinics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">excellent</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled dental visits</CardDescription>
              </div>
              <Link href="/patient/appointments">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Link href="/patient/search">
                  <Button className="mt-4">Book Your First Appointment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{appointment.service.name}</h3>
                        <p className="text-sm text-muted-foreground">{appointment.clinic.name}</p>
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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your completed appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{appointment.service.name}</h3>
                        <p className="text-sm text-muted-foreground">{appointment.clinic.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.startTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Completed
                    </Badge>
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
