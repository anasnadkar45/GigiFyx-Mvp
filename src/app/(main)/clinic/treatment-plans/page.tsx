"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  X,
  Calendar,
  DollarSign,
  User,
  Send,
  Edit,
  Clipboard,
} from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Patient {
  id: string
  name: string
  age?: number
  gender?: string
  bloodGroup?: string
  allergies?: string
  medicalNote?: string
}

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

export default function TreatmentPlanPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [newSymptom, setNewSymptom] = useState("")
  const [medicalHistory, setMedicalHistory] = useState("")
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "emergency">("medium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [disclaimer, setDisclaimer] = useState("")
  const [activeTab, setActiveTab] = useState("create")
  const [savedPlans, setSavedPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharingPlan, setSharingPlan] = useState<string | null>(null)

  useEffect(() => {
    // Test AI connection first
    const testAI = async () => {
      try {
        const response = await fetch("/api/test-ai")
        const data = await response.json()
        console.log("Gemini AI test:", data)

        if (!data.success) {
          setError("Gemini AI SDK not properly configured")
          toast.error("Gemini AI configuration issue")
        }
      } catch (error) {
        console.error("AI test failed:", error)
        setError("Failed to connect to Gemini AI service")
      }
    }

    // Fetch patients for the clinic
    const fetchPatients = async () => {
      try {
        const response = await fetch("/api/clinic/patients")
        const data = await response.json()

        if (response.ok) {
          setPatients(data.patients || [])
          console.log("Loaded patients:", data.patients?.length || 0)
        } else {
          console.error("Failed to load patients:", data.error)
          toast.error(data.error || "Failed to load patients")
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
        toast.error("Failed to load patients")
      }
    }

    // Fetch saved treatment plans
    const fetchTreatmentPlans = async () => {
      try {
        const response = await fetch("/api/clinic/treatment-plans")
        const data = await response.json()

        if (response.ok) {
          setSavedPlans(data.plans || [])
          console.log("Loaded treatment plans:", data.plans?.length || 0)
        } else {
          console.error("Failed to load treatment plans:", data.error)
          toast.error(data.error || "Failed to load treatment plans")
        }
      } catch (error) {
        console.error("Error fetching treatment plans:", error)
        toast.error("Failed to load treatment plans")
      } finally {
        setIsLoading(false)
      }
    }

    testAI()
    fetchPatients()
    fetchTreatmentPlans()
  }, [])

  const addSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
      setSymptoms([...symptoms, newSymptom.trim()])
      setNewSymptom("")
    }
  }

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter((s) => s !== symptom))
  }

  const generateTreatmentPlan = async () => {
    if (!selectedPatientId || !diagnosis || symptoms.length === 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log("Sending request to generate treatment plan...")

      const requestBody = {
        patientId: selectedPatientId,
        diagnosis,
        symptoms,
        medicalHistory,
        urgency,
      }

      console.log("Request body:", requestBody)

      const response = await fetch("/api/ai/treatment-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log("Response:", data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${data.details || "Unknown error"}`)
      }

      setTreatmentPlan(data.treatmentPlan)
      setPlanId(data.planId)
      setDisclaimer(data.disclaimer)
      toast.success("Treatment plan generated successfully")
    } catch (error) {
      console.error("Error generating treatment plan:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(errorMessage)
      toast.error(`Failed to generate treatment plan: ${errorMessage}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const approvePlan = async () => {
    if (!planId) return

    try {
      const response = await fetch(`/api/clinic/treatment-plans/${planId}/approve`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve plan")
      }

      toast.success("Treatment plan approved")

      // Refresh saved plans
      const plansResponse = await fetch("/api/clinic/treatment-plans")
      const plansData = await plansResponse.json()

      if (plansResponse.ok) {
        setSavedPlans(plansData.plans || [])
        setActiveTab("saved")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to approve treatment plan")
    }
  }

  const resetForm = () => {
    setSelectedPatientId("")
    setDiagnosis("")
    setSymptoms([])
    setNewSymptom("")
    setMedicalHistory("")
    setUrgency("medium")
    setTreatmentPlan(null)
    setPlanId(null)
    setDisclaimer("")
    setError(null)
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const shareWithPatient = async (planId: string) => {
    setSharingPlan(planId)
    try {
      const response = await fetch(`/api/clinic/treatment-plans/${planId}/share`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to share plan")
      }

      toast.success("Treatment plan shared with patient")

      // Refresh saved plans
      const plansResponse = await fetch("/api/clinic/treatment-plans")
      const plansData = await plansResponse.json()

      if (plansResponse.ok) {
        setSavedPlans(plansData.plans || [])
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to share treatment plan")
    } finally {
      setSharingPlan(null)
    }
  }

  if (error && !isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              {error}. Please check your AI SDK configuration and environment variables.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-purple-600" />
            AI Treatment Plan Generator
          </h1>
          <p className="text-gray-600">Create comprehensive dental treatment plans with AI assistance</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="create">Create New Plan</TabsTrigger>
            <TabsTrigger value="saved">Saved Plans ({savedPlans.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            {treatmentPlan ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Generated Treatment Plan</CardTitle>
                    <Badge className={getPriorityColor(urgency)}>
                      {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Urgency
                    </Badge>
                  </div>
                  <CardDescription>
                    Patient: {patients.find((p) => p.id === selectedPatientId)?.name} • Diagnosis: {diagnosis}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Treatment Phases */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Treatment Phases</h3>
                    {treatmentPlan.treatmentPhases.map((phase, index) => (
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
                            <h5 className="text-sm font-medium">Procedures:</h5>
                            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-1">
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
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Cost Estimate */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Cost Estimate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                          {treatmentPlan.estimatedCost.currency} {treatmentPlan.estimatedCost.minimum} -{" "}
                          {treatmentPlan.estimatedCost.maximum}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Estimated total cost range</p>
                      </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Treatment Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{treatmentPlan.timeline}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Follow-up Schedule */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Follow-up Schedule</h3>
                    <ul className="space-y-2">
                      {treatmentPlan.followUpSchedule.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Calendar className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Home Care Tips */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Home Care Instructions</h3>
                    <ul className="space-y-2">
                      {treatmentPlan.homeCareTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Warning Signs */}
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      Warning Signs to Watch For
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {treatmentPlan.warningSignsToWatch.map((sign, index) => (
                        <li key={index} className="flex items-start gap-2 text-red-700">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{sign}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Disclaimer */}
                  <Alert variant="destructive" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Professional Review Required</AlertTitle>
                    <AlertDescription className="text-sm">{disclaimer}</AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3 justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetForm}>
                      Create New Plan
                    </Button>
                    <Button variant="outline" onClick={() => copyToClipboard(JSON.stringify(treatmentPlan, null, 2))}>
                      <Clipboard className="h-4 w-4 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                      Print Plan
                    </Button>
                    <Button onClick={approvePlan}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Plan
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Create Treatment Plan</CardTitle>
                  <CardDescription>Fill in the details below to generate an AI-assisted treatment plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Debug Info */}
                  {patients.length === 0 && !isLoading && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Patients Found</AlertTitle>
                      <AlertDescription>
                        No patients found for your clinic. Patients are automatically added when they book appointments.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Patient*</label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoading ? "Loading patients..." : "Select a patient"} />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} {patient.age ? `(${patient.age} years)` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Diagnosis*</label>
                    <Input
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g., Severe dental caries, Periodontal disease"
                    />
                  </div>

                  {/* Symptoms */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Symptoms*</label>
                    <div className="flex gap-2">
                      <Input
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        placeholder="e.g., tooth pain, swelling, sensitivity"
                        onKeyPress={(e) => e.key === "Enter" && addSymptom()}
                      />
                      <Button onClick={addSymptom} size="sm" variant="secondary">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {symptoms.map((symptom) => (
                        <Badge
                          key={symptom}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSymptom(symptom)}
                        >
                          {symptom} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    {symptoms.length === 0 && <p className="text-xs text-gray-500">Please add at least one symptom</p>}
                  </div>

                  {/* Medical History */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Medical History (optional)</label>
                    <Textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      placeholder="Any relevant medical history not in the patient's profile"
                      rows={3}
                    />
                  </div>

                  {/* Urgency */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Treatment Urgency</label>
                    <Select value={urgency} onValueChange={(value: any) => setUrgency(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Can be scheduled at patient's convenience</SelectItem>
                        <SelectItem value="medium">Medium - Should be addressed within weeks</SelectItem>
                        <SelectItem value="high">High - Should be addressed within days</SelectItem>
                        <SelectItem value="emergency">Emergency - Immediate attention required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={generateTreatmentPlan}
                    disabled={isGenerating || !selectedPatientId || !diagnosis || symptoms.length === 0}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Treatment Plan...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Treatment Plan
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Saved Treatment Plans</CardTitle>
                <CardDescription>View and manage all treatment plans created for your patients</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : savedPlans.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {savedPlans.map((plan) => (
                        <Card key={plan.id} className="overflow-hidden">
                          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                            <div>
                              <h4 className="font-medium">{plan.patient.name}</h4>
                              <p className="text-sm text-gray-500">
                                Created: {new Date(plan.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(plan.status)}>{plan.status.replace(/_/g, " ")}</Badge>
                          </div>
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div>
                                <span className="font-medium">Diagnosis:</span> {plan.diagnosis}
                              </div>
                              <div>
                                <span className="font-medium">Symptoms:</span> {plan.symptoms}
                              </div>
                              <div>
                                <span className="font-medium">Urgency:</span> {plan.urgency}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                              <Button size="sm" variant="outline">
                                <FileText className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                              {plan.status === "DRAFT" && (
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                              {plan.status === "DRAFT" && (
                                <Button size="sm">
                                  <Send className="h-3 w-3 mr-1" />
                                  Submit for Approval
                                </Button>
                              )}
                              {plan.status === "APPROVED" && !plan.sharedWithPatient && (
                                <Button
                                  size="sm"
                                  onClick={() => shareWithPatient(plan.id)}
                                  disabled={sharingPlan === plan.id}
                                >
                                  {sharingPlan === plan.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <User className="h-3 w-3 mr-1" />
                                  )}
                                  Share with Patient
                                </Button>
                              )}
                              {plan.status === "APPROVED" && plan.sharedWithPatient && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Shared
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No treatment plans found</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab("create")}>
                      Create Your First Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
