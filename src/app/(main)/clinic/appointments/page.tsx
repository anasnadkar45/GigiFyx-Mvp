"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Search, User, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Wrapper } from "@/components/global/Wrapper"
import { Topbar, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"

interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: string
  patientDescription?: string
  clinicNotes?: string
  totalAmount: number
  paymentStatus: string
  user: {
    id: string
    name: string
    email: string
  }
  service: {
    id: string
    name: string
    price: number
  }
}

export default function ClinicAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clinic/appointments")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setAppointments(data.appointments || [])
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast.error(error instanceof Error ? error.message : "Failed to fetch appointments")
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const response = await fetch(`/api/clinic/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update appointment status")
      }

      toast.success(`Appointment ${status.toLowerCase()} successfully`)
      fetchAppointments() // Refresh the list
    } catch (error) {
      console.error("Error updating appointment status:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update appointment status")
    }
  }

  const addClinicNotes = async (appointmentId: string, notes: string) => {
    try {
      const response = await fetch(`/api/clinic/appointments/${appointmentId}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clinicNotes: notes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update appointment notes")
      }

      toast.success("Notes added successfully")
      fetchAppointments() // Refresh the list
    } catch (error) {
      console.error("Error updating appointment notes:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update appointment notes")
    }
  }

  // Filter appointments based on search, status, and date
  const filterAppointments = (appointments: Appointment[]) => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "ALL" || appointment.status === statusFilter

      const matchesDate = !dateFilter || format(new Date(appointment.startTime), "yyyy-MM-dd") === dateFilter

      return matchesSearch && matchesStatus && matchesDate
    })
  }

  // Separate appointments into upcoming, today, and past
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const upcomingAppointments = filterAppointments(
    appointments.filter(
      (apt) => new Date(apt.startTime) >= tomorrow && apt.status !== "CANCELLED" && apt.status !== "COMPLETED",
    ),
  )

  const todayAppointments = filterAppointments(
    appointments.filter(
      (apt) => new Date(apt.startTime) >= today && new Date(apt.startTime) < tomorrow && apt.status !== "CANCELLED",
    ),
  )

  const pastAppointments = filterAppointments(
    appointments.filter(
      (apt) => new Date(apt.startTime) < today || apt.status === "COMPLETED" || apt.status === "CANCELLED",
    ),
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
      <Topbar className="justify-between">
        <TopbarContent>
          <TopbarTitle>Appointments</TopbarTitle>
          <TopbarDescription>Manage your clinic appointments</TopbarDescription>
        </TopbarContent>
      </Topbar>
      <Wrapper>
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
                <p className="text-xs text-muted-foreground">appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                <p className="text-xs text-muted-foreground">scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {appointments.filter((a) => a.status === "COMPLETED").length}
                </div>
                <p className="text-xs text-muted-foreground">appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {appointments.filter((a) => a.status === "CANCELLED").length}
                </div>
                <p className="text-xs text-muted-foreground">appointments</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients or services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="BOOKED">Booked</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full md:w-48"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appointments Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="today">Today ({todayAppointments.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
            </TabsList>

            {/* Today's Appointments */}
            <TabsContent value="today">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Appointments</CardTitle>
                  <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
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
                        <Card key={appointment.id} className="border">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{appointment.user.name}</h3>
                                  <p className="text-muted-foreground">{appointment.service.name}</p>
                                  <div className="flex items-center gap-2 text-sm mt-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {format(new Date(appointment.startTime), "h:mm a")} -{" "}
                                      {format(new Date(appointment.endTime), "h:mm a")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col md:items-end gap-2">
                                {getStatusBadge(appointment.status)}
                                <div className="text-sm">
                                  <span className="font-medium">Price: </span>
                                  <span className="text-primary font-semibold">RM {appointment.service.price}</span>
                                </div>
                              </div>
                            </div>

                            {appointment.patientDescription && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-2">Patient Notes:</h4>
                                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                                  {appointment.patientDescription}
                                </p>
                              </div>
                            )}

                            {appointment.clinicNotes && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-2">Clinic Notes:</h4>
                                <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                                  {appointment.clinicNotes}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {appointment.status === "BOOKED" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(appointment.id, "CONFIRMED")}
                                  className="text-green-600 border-green-600 bg-green-50 hover:bg-green-100"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirm
                                </Button>
                              )}

                              {(appointment.status === "BOOKED" || appointment.status === "CONFIRMED") && (
                                <Button
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(appointment.id, "IN_PROGRESS")}
                                  className="text-blue-600 border-blue-600 bg-blue-50 hover:bg-blue-100"
                                >
                                  Start Appointment
                                </Button>
                              )}

                              {appointment.status === "IN_PROGRESS" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(appointment.id, "COMPLETED")}
                                  className="text-green-600 border-green-600 bg-green-50 hover:bg-green-100"
                                >
                                  Complete
                                </Button>
                              )}

                              {(appointment.status === "BOOKED" || appointment.status === "CONFIRMED") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAppointmentStatus(appointment.id, "CANCELLED")}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const notes = prompt("Enter clinic notes:", appointment.clinicNotes || "")
                                  if (notes !== null) {
                                    addClinicNotes(appointment.id, notes)
                                  }
                                }}
                              >
                                Add Notes
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upcoming Appointments */}
            <TabsContent value="upcoming">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Future scheduled appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming appointments</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{appointment.user.name}</h3>
                              <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(appointment.startTime), "EEEE, MMMM d")} at{" "}
                                {format(new Date(appointment.startTime), "h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(appointment.status)}
                            {appointment.status === "BOOKED" && (
                              <Button
                                size="sm"
                                onClick={() => updateAppointmentStatus(appointment.id, "CONFIRMED")}
                                className="text-green-600 border-green-600 bg-green-50 hover:bg-green-100"
                              >
                                Confirm
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Past Appointments */}
            <TabsContent value="past">
              <Card>
                <CardHeader>
                  <CardTitle>Past Appointments</CardTitle>
                  <CardDescription>Completed and cancelled appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  {pastAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No past appointments</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${appointment.status === "COMPLETED" ? "bg-green-100" : "bg-red-100"
                                }`}
                            >
                              {appointment.status === "COMPLETED" ? (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              ) : (
                                <XCircle className="h-6 w-6 text-red-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold">{appointment.user.name}</h3>
                              <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(appointment.startTime), "MMMM d, yyyy")} at{" "}
                                {format(new Date(appointment.startTime), "h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(appointment.status)}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const notes = prompt("Enter clinic notes:", appointment.clinicNotes || "")
                                if (notes !== null) {
                                  addClinicNotes(appointment.id, notes)
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Wrapper>
    </>
  )
}
