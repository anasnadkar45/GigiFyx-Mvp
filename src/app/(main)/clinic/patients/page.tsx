"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Search,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Filter,
  Download,
  UserCheck,
  UserX,
  AlertTriangle,
  Clock,
  TrendingUp,
  Heart,
  Activity,
  FileHeart,
  User,
  MoreVertical,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Topbar, TopbarContent, TopbarDescription, TopbarTitle, TopbarAction } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface Patient {
  id: string
  name: string
  icOrPassport: string
  phone: string
  age?: number
  email?: string
  address?: string
  gender?: "MALE" | "FEMALE" | "OTHER"
  bloodGroup?: string
  allergies?: string
  medicalNote?: string
  notes?: string
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  user: {
    id: string
    name: string
    email: string
    createdAt: string
  }
  appointments: Array<{
    id: string
    startTime: string
    endTime: string
    status: string
    service: {
      name: string
      price?: number
      category: string
    }
  }>
  treatmentPlans: Array<{
    id: string
    diagnosis: string
    urgency: string
    status: string
    createdAt: string
    creator: {
      name: string
    }
  }>
  _count: {
    appointments: number
    treatmentPlans: number
  }
  createdAt: string
}

interface PatientStats {
  ACTIVE: number
  INACTIVE: number
  SUSPENDED: number
}

export default function ClinicPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState<PatientStats>({ ACTIVE: 0, INACTIVE: 0, SUSPENDED: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientDialog, setShowPatientDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [searchTerm, statusFilter, sortBy, sortOrder, currentPage])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: "10",
      })

      const response = await fetch(`/api/clinic/patients?${params}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPatients(data.patients || [])
      setStats(data.stats || { ACTIVE: 0, INACTIVE: 0, SUSPENDED: 0 })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching patients:", error)
      toast.error("Failed to fetch patients")
    } finally {
      setLoading(false)
    }
  }

  const updatePatientStatus = async (patientId: string, status: string) => {
    try {
      const response = await fetch(`/api/clinic/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update patient status")
      }

      toast.success("Patient status updated successfully")
      fetchPatients()
    } catch (error) {
      console.error("Error updating patient status:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update patient status")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
            <UserCheck className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "INACTIVE":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600 text-xs">
            <UserX className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )
      case "SUSPENDED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  const getAppointmentStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { color: "text-green-600 border-green-600", icon: UserCheck },
      BOOKED: { color: "text-blue-600 border-blue-600", icon: Calendar },
      CONFIRMED: { color: "text-blue-600 border-blue-600", icon: Calendar },
      CANCELLED: { color: "text-red-600 border-red-600", icon: UserX },
      NO_SHOW: { color: "text-orange-600 border-orange-600", icon: AlertTriangle },
      IN_PROGRESS: { color: "text-purple-600 border-purple-600", icon: Activity },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "text-gray-600 border-gray-600",
      icon: Clock,
    }
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">{status.replace("_", " ")}</span>
        <span className="sm:hidden">{status.split("_")[0]}</span>
      </Badge>
    )
  }

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      LOW: { color: "text-green-600 border-green-600", icon: Activity },
      MEDIUM: { color: "text-yellow-600 border-yellow-600", icon: Clock },
      HIGH: { color: "text-orange-600 border-orange-600", icon: AlertTriangle },
      EMERGENCY: { color: "text-red-600 border-red-600", icon: Heart },
    }

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || {
      color: "text-gray-600 border-gray-600",
      icon: Activity,
    }
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {urgency}
      </Badge>
    )
  }

  return (
    <div>
      {/* Header */}
      <Topbar>
        <TopbarContent>
          <TopbarTitle>Patient Management</TopbarTitle>
          <TopbarDescription>Manage and monitor your clinic's patients</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <Link href="/clinic/appointments/new">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Appointment</span>
                <span className="sm:hidden">New</span>
              </Link>
            </Button>
          </div>
        </TopbarAction>
      </Topbar>

      <Wrapper className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.ACTIVE + stats.INACTIVE + stats.SUSPENDED}</div>
              <p className="text-xs text-muted-foreground">All patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.ACTIVE}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Inactive</CardTitle>
              <UserX className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-600">{stats.INACTIVE}</div>
              <p className="text-xs text-muted-foreground">Inactive status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {patients.filter((p) => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </div>
              <p className="text-xs text-muted-foreground">New patients</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Mobile Filters Sheet */}
          <div className="flex items-center justify-between sm:hidden">
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[400px]">
                <SheetHeader>
                  <SheetTitle>Filter Patients</SheetTitle>
                  <SheetDescription>Filter and sort your patient list</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Registration Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="age">Age</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Order</Label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest First</SelectItem>
                        <SelectItem value="asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => setShowFilters(false)} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <p className="text-sm text-muted-foreground">{patients.length} patients</p>
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Registration Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="age">Age</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest</SelectItem>
                <SelectItem value="asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Patients List */}
        <div className="space-y-3 sm:space-y-4">
          {patients.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No patients found</p>
              </CardContent>
            </Card>
          ) : (
            patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Mobile Layout */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm truncate">{patient.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPatient(patient)
                              setShowPatientDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(patient.status)}
                        {patient.gender && (
                          <Badge variant="secondary" className="text-xs">
                            {patient.gender}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {patient._count.appointments} apt • {patient._count.treatmentPlans} plans
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                      {patient.appointments.slice(0, 2).map((apt) => (
                        <div key={apt.id} className="flex-shrink-0">
                          {getAppointmentStatusBadge(apt.status)}
                        </div>
                      ))}
                      {patient.treatmentPlans.slice(0, 1).map((plan) => (
                        <div key={plan.id} className="flex-shrink-0">
                          {getUrgencyBadge(plan.urgency)}
                        </div>
                      ))}
                    </div>

                    <Select value={patient.status} onValueChange={(value) => updatePatientStatus(patient.id, value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Wrapper>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPatient?.name} - Patient Details</DialogTitle>
            <DialogDescription>Complete patient information and medical history</DialogDescription>
          </DialogHeader>
          {selectedPatient && <PatientDetailsView patient={selectedPatient} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PatientDetailsView({ patient }: { patient: Patient }) {
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([])
  const [newTreatmentPlan, setNewTreatmentPlan] = useState({
    diagnosis: "",
    symptoms: "",
    urgency: "MEDIUM",
    aiGeneratedPlan: "",
  })
  const [loadingTreatmentPlans, setLoadingTreatmentPlans] = useState(false)

  useEffect(() => {
    fetchTreatmentPlans()
  }, [patient.id])

  const fetchTreatmentPlans = async () => {
    try {
      setLoadingTreatmentPlans(true)
      const response = await fetch(`/api/clinic/patients/${patient.id}/treatment-plans`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setTreatmentPlans(data.treatmentPlans || [])
    } catch (error) {
      console.error("Error fetching treatment plans:", error)
      toast.error("Failed to fetch treatment plans")
    } finally {
      setLoadingTreatmentPlans(false)
    }
  }

  const createTreatmentPlan = async () => {
    if (!newTreatmentPlan.diagnosis.trim() || !newTreatmentPlan.symptoms.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch(`/api/clinic/patients/${patient.id}/treatment-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTreatmentPlan),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create treatment plan")
      }

      toast.success("Treatment plan created successfully")
      setNewTreatmentPlan({
        diagnosis: "",
        symptoms: "",
        urgency: "MEDIUM",
        aiGeneratedPlan: "",
      })
      fetchTreatmentPlans()
    } catch (error) {
      console.error("Error creating treatment plan:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create treatment plan")
    }
  }

  const getAppointmentStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { color: "text-green-600 border-green-600", icon: UserCheck },
      BOOKED: { color: "text-blue-600 border-blue-600", icon: Calendar },
      CONFIRMED: { color: "text-blue-600 border-blue-600", icon: Calendar },
      CANCELLED: { color: "text-red-600 border-red-600", icon: UserX },
      NO_SHOW: { color: "text-orange-600 border-orange-600", icon: AlertTriangle },
      IN_PROGRESS: { color: "text-purple-600 border-purple-600", icon: Activity },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "text-gray-600 border-gray-600",
      icon: Clock,
    }
    const Icon = config.icon

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      LOW: { color: "text-green-600 border-green-600", icon: Activity },
      MEDIUM: { color: "text-yellow-600 border-yellow-600", icon: Clock },
      HIGH: { color: "text-orange-600 border-orange-600", icon: AlertTriangle },
      EMERGENCY: { color: "text-red-600 border-red-600", icon: Heart },
    }

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || {
      color: "text-gray-600 border-gray-600",
      icon: Activity,
    }
    const Icon = config.icon

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {urgency}
      </Badge>
    )
  }

  const getTreatmentStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: "text-gray-600 border-gray-600", icon: FileText },
      PENDING_APPROVAL: { color: "text-yellow-600 border-yellow-600", icon: Clock },
      APPROVED: { color: "text-green-600 border-green-600", icon: UserCheck },
      IN_PROGRESS: { color: "text-blue-600 border-blue-600", icon: Activity },
      COMPLETED: { color: "text-green-600 border-green-600", icon: UserCheck },
      CANCELLED: { color: "text-red-600 border-red-600", icon: UserX },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "text-gray-600 border-gray-600",
      icon: FileText,
    }
    const Icon = config.icon

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs sm:text-sm">
            Appointments
          </TabsTrigger>
          <TabsTrigger value="treatment" className="text-xs sm:text-sm">
            Treatment
          </TabsTrigger>
          <TabsTrigger value="medical" className="text-xs sm:text-sm">
            Medical
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Full Name</Label>
              <p className="text-sm text-muted-foreground">{patient.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">IC/Passport</Label>
              <p className="text-sm text-muted-foreground">{patient.icOrPassport}</p>
            </div>
            {patient.age && (
              <div>
                <Label className="text-sm font-medium">Age</Label>
                <p className="text-sm text-muted-foreground">{patient.age} years old</p>
              </div>
            )}
            {patient.gender && (
              <div>
                <Label className="text-sm font-medium">Gender</Label>
                <p className="text-sm text-muted-foreground">{patient.gender}</p>
              </div>
            )}
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
                {patient.email || "Not provided"}
              </p>
            </div>
            {patient.address && (
              <div className="sm:col-span-2">
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5" />
                  {patient.address}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Appointment History</Label>
            {patient.appointments.length > 0 ? (
              <div className="space-y-2 mt-2">
                {patient.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{appointment.service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                        {new Date(appointment.startTime).toLocaleTimeString()} -{" "}
                        {new Date(appointment.endTime).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Category: {appointment.service.category}</p>
                      {appointment.service.price && (
                        <p className="text-xs text-muted-foreground">RM {appointment.service.price}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getAppointmentStatusBadge(appointment.status)}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/clinic/appointments/${appointment.id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No appointments found</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-4">
          {/* Create New Treatment Plan */}
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <Label className="text-sm font-medium">Create New Treatment Plan</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Diagnosis</Label>
                <Input
                  placeholder="Enter diagnosis..."
                  value={newTreatmentPlan.diagnosis}
                  onChange={(e) => setNewTreatmentPlan((prev) => ({ ...prev, diagnosis: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Urgency Level</Label>
                <Select
                  value={newTreatmentPlan.urgency}
                  onValueChange={(value) => setNewTreatmentPlan((prev) => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Symptoms</Label>
              <Textarea
                placeholder="Describe symptoms..."
                value={newTreatmentPlan.symptoms}
                onChange={(e) => setNewTreatmentPlan((prev) => ({ ...prev, symptoms: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs">Treatment Plan</Label>
              <Textarea
                placeholder="Enter treatment plan details..."
                value={newTreatmentPlan.aiGeneratedPlan}
                onChange={(e) => setNewTreatmentPlan((prev) => ({ ...prev, aiGeneratedPlan: e.target.value }))}
                rows={3}
              />
            </div>
            <Button onClick={createTreatmentPlan} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Treatment Plan
            </Button>
          </div>

          {/* Treatment Plans List */}
          <div>
            <Label className="text-sm font-medium">Treatment Plans</Label>
            {loadingTreatmentPlans ? (
              <p className="text-sm text-muted-foreground mt-2">Loading treatment plans...</p>
            ) : treatmentPlans.length > 0 ? (
              <div className="space-y-3 mt-2">
                {treatmentPlans.map((plan) => (
                  <div key={plan.id} className="p-3 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getTreatmentStatusBadge(plan.status)}
                        {getUrgencyBadge(plan.urgency)}
                        <span className="text-xs text-muted-foreground">
                          by {plan.creator.name} • {new Date(plan.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <FileHeart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs font-medium">Diagnosis</Label>
                        <p className="text-sm">{plan.diagnosis}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Symptoms</Label>
                        <p className="text-sm">{plan.symptoms}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Treatment Plan</Label>
                        <p className="text-sm">{plan.aiGeneratedPlan}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No treatment plans found</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patient.bloodGroup && (
              <div>
                <Label className="text-sm font-medium">Blood Group</Label>
                <p className="text-sm text-muted-foreground">{patient.bloodGroup}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">
                {patient.status === "ACTIVE" && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
                {patient.status === "INACTIVE" && (
                  <Badge variant="outline" className="text-gray-600 border-gray-600">
                    <UserX className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
                {patient.status === "SUSPENDED" && (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Suspended
                  </Badge>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium">Allergies</Label>
              <p className="text-sm text-muted-foreground">{patient.allergies || "None reported"}</p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium">Medical Notes</Label>
              <p className="text-sm text-muted-foreground">{patient.medicalNote || "No additional notes"}</p>
            </div>
            {patient.notes && (
              <div className="sm:col-span-2">
                <Label className="text-sm font-medium">General Notes</Label>
                <p className="text-sm text-muted-foreground">{patient.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
