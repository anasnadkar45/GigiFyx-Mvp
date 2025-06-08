"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Users, Search, Eye, Trash2, Calendar, Mail, Phone, MapPin, User, Activity, Star } from "lucide-react"
import { toast } from "sonner"

interface Patient {
  id: string
  name: string
  icOrPassport: string
  phone: string
  age: number
  email: string
  address: string
  gender: "MALE" | "FEMALE" | "OTHER"
  bloodGroup?: string
  allergies?: string
  medicalNote?: string
  user: {
    id: string
    name: string
    email: string
    createdAt: string
    updatedAt: string
  }
  appointments: Array<{
    id: string
    status: string
    startTime: string
    clinic: {
      name: string
    }
  }>
  _count: {
    appointments: number
    reviews: number
  }
  createdAt: string
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("ALL")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/patients")
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPatients(data.patients || [])
    } catch (error) {
      console.error("Error fetching patients:", error)
      toast.error("Failed to fetch patients")
    } finally {
      setLoading(false)
    }
  }

  const deletePatient = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/patients/${patientId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete patient")
      }

      toast.success("Patient deleted successfully")
      fetchPatients() // Refresh the list
    } catch (error) {
      console.error("Error deleting patient:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete patient")
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.icOrPassport.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGender = genderFilter === "ALL" || patient.gender === genderFilter
    return matchesSearch && matchesGender
  })

  const getGenderBadge = (gender: string) => {
    const colors = {
      MALE: "bg-blue-100 text-blue-800",
      FEMALE: "bg-pink-100 text-pink-800",
      OTHER: "bg-gray-100 text-gray-800",
    }
    return <Badge className={colors[gender as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{gender}</Badge>
  }

  // if (loading) {
  //   return (
  //     <div className="p-6">
  //       <div className="flex items-center justify-center h-64">
  //         <p>Loading patients...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground">Manage and monitor patient accounts</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name, email, or IC/Passport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Genders</SelectItem>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Male Patients</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{patients.filter((p) => p.gender === "MALE").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Female Patients</CardTitle>
            <User className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-500">
              {patients.filter((p) => p.gender === "FEMALE").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {patients.filter((p) => p._count.appointments > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Patients ({filteredPatients.length})</CardTitle>
          <CardDescription>Manage patient accounts and view their information</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No patients found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">IC/Passport: {patient.icOrPassport}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-muted-foreground">Age: {patient.age}</p>
                        <p className="text-sm text-muted-foreground">{patient._count.appointments} appointments</p>
                        <p className="text-sm text-muted-foreground">
                          Joined: {new Date(patient.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getGenderBadge(patient.gender)}

                    {/* View Details Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedPatient(patient)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{patient.name} - Patient Details</DialogTitle>
                          <DialogDescription>Complete patient information and medical history</DialogDescription>
                        </DialogHeader>
                        {selectedPatient && <PatientDetails patient={selectedPatient} />}
                      </DialogContent>
                    </Dialog>

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePatient(patient.id)}
                      disabled={actionLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PatientDetails({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Full Name</Label>
              <p className="text-sm text-muted-foreground">{patient.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">IC/Passport</Label>
              <p className="text-sm text-muted-foreground">{patient.icOrPassport}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Age</Label>
              <p className="text-sm text-muted-foreground">{patient.age} years old</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Gender</Label>
              <div className="mt-1">
                <Badge className={getGenderBadgeClass(patient.gender)}>{patient.gender}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {patient.phone}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {patient.email}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Address</Label>
              <p className="text-sm text-muted-foreground flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5" />
                {patient.address}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Blood Group</Label>
              <p className="text-sm text-muted-foreground">{patient.bloodGroup || "Not specified"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Allergies</Label>
              <p className="text-sm text-muted-foreground">{patient.allergies || "None reported"}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Medical Notes</Label>
              <p className="text-sm text-muted-foreground">{patient.medicalNote || "No additional notes"}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Recent Appointments</Label>
            {patient.appointments && patient.appointments.length > 0 ? (
              <div className="space-y-2 mt-2">
                {patient.appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{appointment.clinic.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                        {new Date(appointment.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant={appointment.status === "COMPLETED" ? "default" : "secondary"}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No appointments found</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Account Created</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(patient.user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(patient.user.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Total Appointments</Label>
              <p className="text-sm text-muted-foreground">{patient._count.appointments}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Total Reviews</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3" />
                {patient._count.reviews}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  function getGenderBadgeClass(gender: string) {
    const colors = {
      MALE: "bg-blue-100 text-blue-800",
      FEMALE: "bg-pink-100 text-pink-800",
      OTHER: "bg-gray-100 text-gray-800",
    }
    return colors[gender as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }
}
