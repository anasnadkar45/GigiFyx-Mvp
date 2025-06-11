import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  FileText,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Building2,
  Download,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { getUserData } from "@/app/utils/hooks"
import { prisma } from "@/app/utils/db"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"
import { notFound } from "next/navigation"

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

export default async function TreatmentPlanDetailPage({ params }: { params: { id: string } }) {
  const user = await getUserData()

  if (!user.user || user.user.role !== "PATIENT") {
    return notFound()
  }

  const treatmentPlan = await prisma.treatmentPlan.findUnique({
    where: {
      id: params.id,
    },
    include: {
      patient: true,
      clinic: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
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
  })

  if (!treatmentPlan || treatmentPlan.patient.userId !== user.user.id || !treatmentPlan.sharedWithPatient) {
    return notFound()
  }

  const aiPlan: TreatmentPlan = JSON.parse(treatmentPlan.aiGeneratedPlan)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-purple-100 text-purple-800"
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
          <TopbarTitle>{treatmentPlan.diagnosis}</TopbarTitle>
          <TopbarDescription>Detailed treatment plan from {treatmentPlan.clinic.name}</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <Link href="/patient/treatment-plans">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
          </Link>
        </TopbarAction>
      </Topbar>

      <Wrapper className="space-y-6">
        {/* Plan Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Treatment Plan Overview
                </CardTitle>
                <CardDescription>
                  Created on {new Date(treatmentPlan.createdAt).toLocaleDateString()} •{" "}
                  {treatmentPlan.sharedAt && `Shared on ${new Date(treatmentPlan.sharedAt).toLocaleDateString()}`}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(treatmentPlan.status)}>
                  {treatmentPlan.status.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(treatmentPlan.urgency)}>
                  {treatmentPlan.urgency} urgency
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Diagnosis</h4>
                <p className="text-sm text-muted-foreground">{treatmentPlan.diagnosis}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Symptoms</h4>
                <p className="text-sm text-muted-foreground">{treatmentPlan.symptoms}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Estimated Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {aiPlan.estimatedCost.currency} {aiPlan.estimatedCost.minimum} - {aiPlan.estimatedCost.maximum}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Total treatment cost range</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Treatment Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{aiPlan.timeline}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Phases */}
        <Card>
          <CardHeader>
            <CardTitle>Treatment Phases</CardTitle>
            <CardDescription>Step-by-step treatment plan breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiPlan.treatmentPhases.map((phase, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                  <h4 className="font-medium">
                    Phase {phase.phase}: {phase.title}
                  </h4>
                  <Badge className={getPriorityColor(phase.priority)}>
                    {phase.priority.charAt(0).toUpperCase() + phase.priority.slice(1)} Priority
                  </Badge>
                </div>
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm text-gray-600">{phase.description}</p>
                  <div>
                    <h5 className="text-sm font-medium mb-2">Procedures:</h5>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                      {phase.procedures.map((procedure, i) => (
                        <li key={i}>{procedure}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    Estimated duration: {phase.estimatedDuration}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Follow-up Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Follow-up Schedule
            </CardTitle>
            <CardDescription>Recommended follow-up appointments and checkups</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {aiPlan.followUpSchedule.map((item, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Home Care Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Home Care Instructions
            </CardTitle>
            <CardDescription>Important care instructions to follow at home</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {aiPlan.homeCareTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Warning Signs */}
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-red-800">Warning Signs to Watch For</AlertTitle>
          <AlertDescription className="text-red-700">
            <ul className="mt-2 space-y-2">
              {aiPlan.warningSignsToWatch.map((sign, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{sign}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-medium">
              If you experience any of these symptoms, contact your dentist immediately.
            </p>
          </AlertDescription>
        </Alert>

        {/* Clinic Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Clinic Contact Information
            </CardTitle>
            <CardDescription>Get in touch with your dental care provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Clinic Details</h4>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{treatmentPlan.clinic.name}</p>
                  <p className="text-muted-foreground">{treatmentPlan.clinic.address}</p>
                  {treatmentPlan.clinic.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {treatmentPlan.clinic.phone}
                    </p>
                  )}
                  {treatmentPlan.clinic.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {treatmentPlan.clinic.email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Your Dentist</h4>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{treatmentPlan.creator.name}</p>
                  <p className="text-muted-foreground">{treatmentPlan.creator.email}</p>
                  {treatmentPlan.approver && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">Approved by:</p>
                      <p className="font-medium">{treatmentPlan.approver.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link href={`/patient/clinics/${treatmentPlan.clinicId}`}>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Follow-up Appointment
                </Button>
              </Link>
              {/* <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call Clinic
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button> */}
            </div>
          </CardContent>
        </Card>
      </Wrapper>
    </>
  )
}
