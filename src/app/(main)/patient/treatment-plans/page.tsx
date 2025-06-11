import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, Clock, DollarSign, CheckCircle, Building2, Download, Eye } from "lucide-react"
import Link from "next/link"
import { getUserData } from "@/app/utils/hooks"
import { prisma } from "@/app/utils/db"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

interface TreatmentPlan {
  treatmentPhases: Array<{
    phase: number
    title: string
    description: string
    estimatedDuration: string
    procedures: string[]
    priority: "low" | "medium" | "high"
  }>
  estimatedCost: {
    minimum: number
    maximum: number
    currency: string
  }
  timeline: string
  followUpSchedule: string[]
  homeCareTips: string[]
  warningSignsToWatch: string[]
}

export default async function PatientTreatmentPlansPage() {
  const user = await getUserData()

  if (!user.user || user.user.role !== "PATIENT") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need a patient account to view treatment plans.</p>
        </div>
      </div>
    )
  }

  // Fetch treatment plans for the patient
  const treatmentPlans = await prisma.treatmentPlan.findMany({
    where: {
      patient: {
        userId: user.user.id,
      },
      sharedWithPatient: true,
    },
    include: {
      clinic: {
        select: {
          name: true,
          address: true,
          phone: true,
        },
      },
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      approver: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      sharedAt: "desc",
    },
  })

  const formattedPlans = treatmentPlans.map((plan) => ({
    ...plan,
    aiGeneratedPlan: JSON.parse(plan.aiGeneratedPlan) as TreatmentPlan,
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-purple-100 text-purple-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      {/* Header Section */}
      <Topbar>
        <TopbarContent>
          <TopbarTitle>My Treatment Plans</TopbarTitle>
          <TopbarDescription>View and manage your dental treatment plans</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <Link href="/patient/dashboard">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </TopbarAction>
      </Topbar>

      <Wrapper className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formattedPlans.length}</div>
              <p className="text-xs text-muted-foreground">treatment plans</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formattedPlans.filter((p) => p.status === "APPROVED" || p.status === "IN_PROGRESS").length}
              </div>
              <p className="text-xs text-muted-foreground">ongoing treatments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formattedPlans.filter((p) => p.status === "COMPLETED").length}</div>
              <p className="text-xs text-muted-foreground">finished treatments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clinics</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(formattedPlans.map((p) => p.clinic.name)).size}</div>
              <p className="text-xs text-muted-foreground">different clinics</p>
            </CardContent>
          </Card>
        </div>

        {/* Treatment Plans List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Treatment Plans</CardTitle>
            <CardDescription>Comprehensive treatment plans created by your dental care providers</CardDescription>
          </CardHeader>
          <CardContent>
            {formattedPlans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Treatment Plans Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Your dentist will share treatment plans with you after your consultation.
                </p>
                <Link href="/patient/search">
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {formattedPlans.map((plan) => (
                  <Card key={plan.id} className="overflow-hidden">
                    {/* Plan Header */}
                    <div className="flex items-center justify-between p-6 border-b bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{plan.diagnosis}</h3>
                          <p className="text-sm text-muted-foreground">
                            Created by {plan.creator.name} at {plan.clinic.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Shared on {plan.sharedAt ? new Date(plan.sharedAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(plan.status)}>{plan.status.replace(/_/g, " ")}</Badge>
                        <Badge variant="outline" className={getPriorityColor(plan.urgency)}>
                          {plan.urgency} urgency
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-6">
                      {/* Symptoms */}
                      <div>
                        <h4 className="font-medium mb-2">Symptoms Addressed</h4>
                        <p className="text-sm text-muted-foreground">{plan.symptoms}</p>
                      </div>

                      {/* Treatment Overview */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Estimated Cost
                          </h4>
                          <div className="text-2xl font-bold text-purple-600">
                            {plan.aiGeneratedPlan.estimatedCost.currency} {plan.aiGeneratedPlan.estimatedCost.minimum} -{" "}
                            {plan.aiGeneratedPlan.estimatedCost.maximum}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Timeline
                          </h4>
                          <p className="text-sm text-muted-foreground">{plan.aiGeneratedPlan.timeline}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Treatment Phases Summary */}
                      <div>
                        <h4 className="font-medium mb-3">
                          Treatment Phases ({plan.aiGeneratedPlan.treatmentPhases.length})
                        </h4>
                        <div className="grid gap-3">
                          {plan.aiGeneratedPlan.treatmentPhases.slice(0, 2).map((phase, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <h5 className="font-medium text-sm">
                                  Phase {phase.phase}: {phase.title}
                                </h5>
                                <p className="text-xs text-muted-foreground">{phase.description}</p>
                              </div>
                              <Badge className={getPriorityColor(phase.priority)} variant="outline">
                                {phase.priority}
                              </Badge>
                            </div>
                          ))}
                          {plan.aiGeneratedPlan.treatmentPhases.length > 2 && (
                            <p className="text-sm text-muted-foreground text-center">
                              +{plan.aiGeneratedPlan.treatmentPhases.length - 2} more phases
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Clinic Information */}
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center text-blue-800">
                          <Building2 className="h-4 w-4 mr-1" />
                          Clinic Information
                        </h4>
                        <div className="text-sm text-blue-700">
                          <p className="font-medium">{plan.clinic.name}</p>
                          <p>{plan.clinic.address}</p>
                          {plan.clinic.phone && <p>Phone: {plan.clinic.phone}</p>}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-4">
                        <Link href={`/patient/treatment-plans/${plan.id}`}>
                          <Button>
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Plan
                          </Button>
                        </Link>
                        {/* <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          Book Follow-up
                        </Button> */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Wrapper>
    </>
  )
}
