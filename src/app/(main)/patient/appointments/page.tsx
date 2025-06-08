import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { getUserData } from "@/app/utils/hooks"
import { prisma } from "@/app/utils/db"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

export default async function PatientAppointmentsPage() {
  const user = await getUserData()

  const appointments = await prisma.appointment.findMany({
    where: {
      userId: user.user?.id,
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          preparation: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  })

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.startTime) > new Date() && apt.status !== "CANCELLED",
  )

  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.startTime) <= new Date() || apt.status === "COMPLETED",
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Booked
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Confirmed
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Completed
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Cancelled
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            In Progress
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Topbar>
        <TopbarContent>
          <TopbarTitle>My Appointments</TopbarTitle>
          <TopbarDescription>Manage your dental appointments</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <Link href="/patient/search">
            <Button>Book New Appointment</Button>
          </Link>
        </TopbarAction>
      </Topbar>

      <Wrapper className="space-y-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments ({upcomingAppointments.length})</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Link href="/patient/clinics">
                  <Button className="mt-4">Book Your First Appointment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{appointment.service.name}</h3>
                            <p className="text-muted-foreground">{appointment.clinic.name}</p>
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(appointment.startTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(appointment.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(appointment.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.clinic.address}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.clinic.phone}</span>
                          </div>
                          {appointment.clinic.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.clinic.email}</span>
                            </div>
                          )}
                          <div className="text-sm">
                            <span className="font-medium">Price: </span>
                            <span className="text-primary font-semibold">RM {appointment.service.price}</span>
                          </div>
                        </div>
                      </div>

                      {appointment.patientDescription && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Your Notes:</h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                            {appointment.patientDescription}
                          </p>
                        </div>
                      )}

                      {appointment.service.preparation && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Preparation Instructions:</h4>
                          <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                            {appointment.service.preparation}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments ({pastAppointments.length})</CardTitle>
            <CardDescription>Your appointment history</CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No past appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{appointment.service.name}</h3>
                        <p className="text-sm text-muted-foreground">{appointment.clinic.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.startTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(appointment.status)}
                      {appointment.status === "COMPLETED" && (
                        <Button variant="outline" size="sm">
                          Leave Review
                        </Button>
                      )}
                    </div>
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
