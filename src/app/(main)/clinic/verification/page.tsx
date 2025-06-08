"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  ExternalLink,
  Bell,
  Building,
  Star,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface VerificationData {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  clinic?: {
    id: string
    name: string
    address: string
    phone: string
    email?: string
    description: string
    image?: string
    documentUrl: string
    status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
    city?: string
    state?: string
    zipCode?: string
    website?: string
    createdAt: string
    updatedAt: string
    services: Array<{
      id: string
      name: string
      category: string
      isActive: string
    }>
    _count: {
      appointments: number
      reviews: number
    }
  }
  notifications: Array<{
    id: string
    title: string
    message: string
    createdAt: string
    isRead: boolean
  }>
  hasClinic: boolean
}

export default function ClinicVerificationPage() {
  const [data, setData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVerificationStatus()
  }, [])

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clinic/verification-status")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.error) throw new Error(result.error)
      setData(result)
    } catch (error) {
      console.error("Error fetching verification status:", error)
      toast.error(`Failed to load verification status: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        title: "Application Under Review",
        description: "Your clinic application is being reviewed by our admin team.",
        progress: 50,
      },
      APPROVED: {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        title: "Clinic Approved",
        description: "Congratulations! Your clinic has been approved and is now live.",
        progress: 100,
      },
      REJECTED: {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        title: "Application Rejected",
        description: "Your clinic application has been rejected. Please review the feedback below.",
        progress: 0,
      },
      SUSPENDED: {
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        title: "Clinic Suspended",
        description: "Your clinic has been temporarily suspended. Please contact support.",
        progress: 75,
      },
    }

    return statusConfig[status as keyof typeof statusConfig]
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "secondary" as const, icon: Clock },
      APPROVED: { variant: "default" as const, icon: CheckCircle },
      REJECTED: { variant: "destructive" as const, icon: XCircle },
      SUSPENDED: { variant: "outline" as const, icon: AlertTriangle },
    }

    const config = variants[status as keyof typeof variants]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <p>Loading verification status...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load verification status</p>
          <Button onClick={fetchVerificationStatus} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!data.hasClinic) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Clinic Application Found</CardTitle>
              <CardDescription>You haven't submitted a clinic application yet.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/clinic/register">
                  <Building className="h-4 w-4 mr-2" />
                  Register Your Clinic
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const clinic = data.clinic!
  const statusInfo = getStatusInfo(clinic.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clinic Verification Status</h1>
          <p className="text-muted-foreground">Track your clinic application progress</p>
        </div>
        <Button onClick={fetchVerificationStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${statusInfo.color}`} />
              <div>
                <CardTitle className="text-xl">{statusInfo.title}</CardTitle>
                <CardDescription className="text-base">{statusInfo.description}</CardDescription>
              </div>
            </div>
            {getStatusBadge(clinic.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Application Progress</span>
              <span>{statusInfo.progress}%</span>
            </div>
            <Progress value={statusInfo.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Clinic Name</h4>
                  <p className="font-medium">{clinic.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                  <div className="mt-1">{getStatusBadge(clinic.status)}</div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Phone</h4>
                  <p className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {clinic.phone}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                  <p className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {clinic.email || "Not provided"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Address</h4>
                  <p className="flex items-start gap-1">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    {clinic.address}
                    {clinic.city && `, ${clinic.city}`}
                    {clinic.state && `, ${clinic.state}`}
                    {clinic.zipCode && ` ${clinic.zipCode}`}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                  <p className="text-sm">{clinic.description}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Application Date</h4>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(clinic.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Last Updated</h4>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(clinic.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Business Document</h4>
                  <Button variant="outline" size="sm" asChild>
                    <a href={clinic.documentUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      View Document
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
                {clinic.website && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Website</h4>
                    <Button variant="outline" size="sm" asChild>
                      <a href={clinic.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visit Website
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Services ({clinic.services.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clinic.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clinic.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.category}</p>
                      </div>
                      <Badge variant={service.isActive === "ACTIVE" ? "default" : "secondary"}>
                        {service.isActive}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No services added yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{clinic._count.appointments}</p>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{clinic._count.reviews}</p>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{clinic.services.length}</p>
                <p className="text-sm text-muted-foreground">Services</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.notifications.length > 0 ? (
                <div className="space-y-3">
                  {data.notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent updates</p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clinic.status === "APPROVED" && (
                <>
                  <Button asChild className="w-full">
                    <Link href="/clinic/dashboard">
                      <Building className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/clinic/services">
                      <Activity className="h-4 w-4 mr-2" />
                      Manage Services
                    </Link>
                  </Button>
                </>
              )}
              {clinic.status === "REJECTED" && (
                <Button asChild className="w-full">
                  <Link href="/clinic/register">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resubmit Application
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href="/support">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status-specific alerts */}
      {clinic.status === "REJECTED" && data.notifications.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Application Rejected</AlertTitle>
          <AlertDescription>
            Please review the feedback in your notifications and address the issues before resubmitting your
            application.
          </AlertDescription>
        </Alert>
      )}

      {clinic.status === "SUSPENDED" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Clinic Suspended</AlertTitle>
          <AlertDescription>
            Your clinic has been temporarily suspended. Please contact our support team for more information and to
            resolve any issues.
          </AlertDescription>
        </Alert>
      )}

      {clinic.status === "APPROVED" && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Congratulations!</AlertTitle>
          <AlertDescription>
            Your clinic is now approved and live. You can start managing appointments and services from your dashboard.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
