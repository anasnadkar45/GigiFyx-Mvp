"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Building2,
  Search,
  Eye,
  Check,
  X,
  Clock,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  email?: string
  description: string
  documents: string[]
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
  owner: {
    id: string
    name: string
    email: string
    phone?: string
    createdAt: string
  }
  _count: {
    appointments: number
    services: number
    reviews: number
  }
  createdAt: string
  updatedAt: string
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  useEffect(() => {
    fetchClinics()
  }, [])

  const fetchClinics = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/clinics")
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setClinics(data.clinics || [])
    } catch (error) {
      console.error("Error fetching clinics:", error)
      toast.error("Failed to fetch clinics")
    } finally {
      setLoading(false)
    }
  }

  const updateClinicStatus = async (
    clinicId: string,
    status: "APPROVED" | "REJECTED" | "SUSPENDED",
    reason?: string,
  ) => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/clinics/${clinicId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, reason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update clinic status")
      }

      toast.success(`Clinic ${status.toLowerCase()} successfully`)
      fetchClinics() // Refresh the list
      setShowRejectDialog(false)
      setRejectionReason("")
    } catch (error) {
      console.error("Error updating clinic status:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update clinic status")
    } finally {
      setActionLoading(false)
    }
  }

  const filteredClinics = clinics.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || clinic.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case "SUSPENDED":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // if (loading) {
  //   return (
  //     <div className="p-6">
  //       <div className="flex items-center justify-center h-64">
  //         <p>Loading clinics...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clinic Management</h1>
          <p className="text-muted-foreground">Review and manage clinic applications</p>
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
                  placeholder="Search clinics or owners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinics.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {clinics.filter((c) => c.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {clinics.filter((c) => c.status === "APPROVED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {clinics.filter((c) => c.status === "REJECTED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinics List */}
      <Card>
        <CardHeader>
          <CardTitle>Clinics ({filteredClinics.length})</CardTitle>
          <CardDescription>Manage clinic applications and approvals</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClinics.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No clinics found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClinics.map((clinic) => (
                <div key={clinic.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{clinic.name}</h3>
                      <p className="text-sm text-muted-foreground">Owner: {clinic.owner.name}</p>
                      <p className="text-sm text-muted-foreground">{clinic.address}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-muted-foreground">
                          Applied: {new Date(clinic.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{clinic._count.appointments} appointments</p>
                        <p className="text-sm text-muted-foreground">{clinic._count.services} services</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(clinic.status)}

                    {/* View Details Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedClinic(clinic)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{clinic.name} - Review Details</DialogTitle>
                          <DialogDescription>
                            Review all clinic information and documents before making a decision
                          </DialogDescription>
                        </DialogHeader>
                        {selectedClinic && <ClinicReviewDetails clinic={selectedClinic} />}
                      </DialogContent>
                    </Dialog>

                    {/* Action Buttons */}
                    {clinic.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateClinicStatus(clinic.id, "APPROVED")}
                          disabled={actionLoading}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          variant="outline"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClinic(clinic)
                            setShowRejectDialog(true)
                          }}
                          disabled={actionLoading}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {clinic.status === "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateClinicStatus(clinic.id, "SUSPENDED")}
                        disabled={actionLoading}
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Suspend
                      </Button>
                    )}

                    {clinic.status === "SUSPENDED" && (
                      <Button
                        size="sm"
                        onClick={() => updateClinicStatus(clinic.id, "APPROVED")}
                        disabled={actionLoading}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        variant="outline"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Reactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Clinic Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedClinic?.name}'s application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why this application is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedClinic) {
                    updateClinicStatus(selectedClinic.id, "REJECTED", rejectionReason)
                  }
                }}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? "Rejecting..." : "Reject Application"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClinicReviewDetails({ clinic }: { clinic: Clinic }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="owner">Owner Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Clinic Name</Label>
              <p className="text-sm text-muted-foreground">{clinic.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {clinic.phone}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {clinic.email || "Not provided"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">{getStatusBadge(clinic.status)}</div>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Address</Label>
              <p className="text-sm text-muted-foreground flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5" />
                {clinic.address}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">{clinic.description}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="owner" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Owner Name</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {clinic.owner.name}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Owner Email</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {clinic.owner.email}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Owner Phone</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {clinic.owner.phone || "Not provided"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Registration Date</Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(clinic.owner.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Submitted Documents</Label>
            {clinic.documents && clinic.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {clinic.documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Document {index + 1}</span>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={doc} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No documents uploaded</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{clinic._count.appointments}</p>
              <p className="text-sm text-muted-foreground">Appointments</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{clinic._count.services}</p>
              <p className="text-sm text-muted-foreground">Services</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{clinic._count.reviews}</p>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Application Date:</span>
              <span className="text-sm text-muted-foreground">{new Date(clinic.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Last Updated:</span>
              <span className="text-sm text-muted-foreground">{new Date(clinic.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  function getStatusBadge(status: string) {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case "SUSPENDED":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
}
