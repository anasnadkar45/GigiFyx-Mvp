"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Home,
  Edit,
  RefreshCw,
  Mail,
  Building,
  MapPin,
  Phone,
  Calendar,
  Bell,
  FileText,
} from "lucide-react"
import Link from "next/link"

interface ClinicData {
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
}

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

interface VerificationGateProps {
  clinic: ClinicData
  user: UserData
}

export default function VerificationGate({ clinic, user }: VerificationGateProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/clinic/verification-status")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        title: "Verification Pending",
        subtitle: "Your application is under review",
        description:
          "Our administrative team is currently reviewing your clinic application. This process typically takes 2-3 business days.",
        progress: 50,
        showReasons: false,
      },
      REJECTED: {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        title: "Verification Declined",
        subtitle: "Unfortunately, your application needs revision",
        description:
          "Our administrative team has reviewed your application and found that it doesn't meet our current requirements.",
        progress: 0,
        showReasons: true,
      },
      SUSPENDED: {
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        title: "Account Suspended",
        subtitle: "Your clinic access has been temporarily suspended",
        description: "Your clinic account has been suspended. Please contact our support team for assistance.",
        progress: 75,
        showReasons: false,
      },
    }

    return configs[status as keyof typeof configs]
  }

  const statusConfig = getStatusConfig(clinic.status)
  const StatusIcon = statusConfig.icon

  const commonRejectionReasons = [
    "Insufficient or unclear credential documentation",
    "Professional experience requirements not met",
    "Incomplete or vague service description",
    "Missing required business registration documents",
    "Unclear or insufficient clinic address verification",
  ]

  const getLatestRejectionReason = () => {
    const rejectionNotification = notifications.find(
      (n) => n.title.toLowerCase().includes("rejected") || n.title.toLowerCase().includes("declined"),
    )
    return rejectionNotification?.message || null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Main Status Card */}
        <Card className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${statusConfig.bgColor} border-2 ${statusConfig.borderColor}`}>
                <StatusIcon className={`h-12 w-12 ${statusConfig.color}`} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{statusConfig.title}</CardTitle>
            <CardDescription className="text-lg">{statusConfig.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">{statusConfig.description}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Progress</span>
                <span>{statusConfig.progress}%</span>
              </div>
              <Progress value={statusConfig.progress} className="h-3" />
            </div>

            {/* Rejection Reasons */}
            {statusConfig.showReasons && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Common reasons for rejection include:</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {commonRejectionReasons.map((reason, index) => (
                      <li key={index} className="text-sm">
                        {reason}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-red-100 rounded-md">
                    <p className="text-sm font-medium">Specific feedback:</p>
                    <p className="text-sm mt-1">
                      {getLatestRejectionReason() ||
                        "Please check your notifications for detailed feedback from our admin team."}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Message */}
            <div className="text-center p-4 bg-white rounded-lg border">
              {clinic.status === "PENDING" && (
                <p className="text-sm text-muted-foreground">
                  You will receive an email notification once the review is complete. You can also check back here for
                  updates.
                </p>
              )}
              {clinic.status === "REJECTED" && (
                <p className="text-sm text-muted-foreground">
                  You can update your clinic profile and resubmit for verification.
                </p>
              )}
              {clinic.status === "SUSPENDED" && (
                <p className="text-sm text-muted-foreground">
                  Please contact our support team to resolve any issues and restore your account.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Home
                </Link>
              </Button>

              {/* {clinic.status === "REJECTED" && (
                <Button asChild>
                  <Link href="/clinic/edit">
                    <Edit className="h-4 w-4 mr-2" />
                    Update Profile
                  </Link>
                </Button>
              )} */}

              {clinic.status === "PENDING" && (
                <Button variant="outline" onClick={fetchNotifications} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Check Status
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinic Information Summary */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Your Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clinic Name</p>
                  <p className="font-medium">{clinic.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm flex items-start gap-1">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    {clinic.address}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <div className="space-y-1">
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {clinic.phone}
                    </p>
                    {clinic.email && (
                      <p className="text-sm flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {clinic.email}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(clinic.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent updates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div> */}

      </div>
    </div>
  )
}
