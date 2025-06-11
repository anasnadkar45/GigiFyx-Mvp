"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Brain, AlertTriangle, CheckCircle, Clock, Loader2, Plus, X, AlertCircle, Calendar } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface SymptomAnalysis {
    urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY"
    possibleConditions: Array<{
        condition: string
        likelihood: "LOW" | "MEDIUM" | "HIGH"
        description: string
    }>
    recommendations: string[]
    immediateActions: string[]
    whenToSeekCare: string
    preventiveMeasures: string[]
}

export default function SymptomCheckerPage() {
    const [symptoms, setSymptoms] = useState<string[]>([])
    const [newSymptom, setNewSymptom] = useState("")
    const [duration, setDuration] = useState("")
    const [severity, setSeverity] = useState<"MILD" | "MODERATE" | "SEVERE">("MODERATE")
    const [additionalInfo, setAdditionalInfo] = useState("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null)
    const [disclaimer, setDisclaimer] = useState("")

    const addSymptom = () => {
        if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
            setSymptoms([...symptoms, newSymptom.trim()])
            setNewSymptom("")
        }
    }

    const removeSymptom = (symptom: string) => {
        setSymptoms(symptoms.filter((s) => s !== symptom))
    }

    const analyzeSymptoms = async () => {
        if (symptoms.length === 0) {
            toast.error("Please add at least one symptom")
            return
        }

        setIsAnalyzing(true)

        try {
            const response = await fetch("/api/ai/symptom-checker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symptoms,
                    duration,
                    severity,
                    additionalInfo,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze symptoms")
            }

            setAnalysis(data.analysis)
            setDisclaimer(data.disclaimer)

            if (data.analysis.urgencyLevel === "HIGH" || data.analysis.urgencyLevel === "EMERGENCY") {
                toast.warning("Your symptoms may require prompt attention", {
                    description: "Please consider seeking professional dental care soon",
                })
            }
        } catch (error) {
            console.error("Error:", error)
            toast.error("Failed to analyze symptoms")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case "LOW":
                return "bg-green-100 text-green-800"
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800"
            case "HIGH":
                return "bg-orange-100 text-orange-800"
            case "EMERGENCY":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getLikelihoodColor = (level: string) => {
        switch (level) {
            case "LOW":
                return "text-green-600"
            case "MEDIUM":
                return "text-yellow-600"
            case "HIGH":
                return "text-red-600"
            default:
                return "text-gray-600"
        }
    }

    const resetForm = () => {
        setSymptoms([])
        setNewSymptom("")
        setDuration("")
        setSeverity("MODERATE")
        setAdditionalInfo("")
        setAnalysis(null)
        setDisclaimer("")
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        <Brain className="h-8 w-8 text-purple-600" />
                        AI Dental Symptom Checker
                    </h1>
                    <p className="text-gray-600">Describe your dental symptoms and get AI-powered guidance on what to do next</p>
                </div>

                {analysis ? (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl">Symptom Analysis</CardTitle>
                                <Badge className={getUrgencyColor(analysis.urgencyLevel)}>
                                    {analysis.urgencyLevel === "EMERGENCY" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                    {analysis.urgencyLevel} Urgency
                                </Badge>
                            </div>
                            <CardDescription>
                                Based on: {symptoms.join(", ")} • Duration: {duration || "Not specified"} • Severity: {severity}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Possible Conditions */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Possible Conditions</h3>
                                <div className="grid gap-3">
                                    {analysis.possibleConditions.map((condition, index) => (
                                        <Card key={index} className="overflow-hidden">
                                            <div className="flex items-center justify-between p-4 border-b">
                                                <h4 className="font-medium">{condition.condition}</h4>
                                                <Badge variant="outline" className={getLikelihoodColor(condition.likelihood)}>
                                                    {condition.likelihood} likelihood
                                                </Badge>
                                            </div>
                                            <CardContent className="pt-4">
                                                <p className="text-sm text-gray-600">{condition.description}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Recommendations */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Recommendations</h3>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((recommendation, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>{recommendation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Immediate Actions */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Immediate Actions</h3>
                                <ul className="space-y-2">
                                    {analysis.immediateActions.map((action, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* When to Seek Care */}
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-800">
                                    <Clock className="h-5 w-5" />
                                    When to Seek Professional Care
                                </h3>
                                <p className="mt-2 text-blue-700">{analysis.whenToSeekCare}</p>
                            </div>

                            {/* Preventive Measures */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Preventive Measures</h3>
                                <ul className="space-y-2">
                                    {analysis.preventiveMeasures.map((measure, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                            <span>{measure}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Disclaimer */}
                            <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Medical Disclaimer</AlertTitle>
                                <AlertDescription className="text-sm">{disclaimer}</AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={resetForm}>
                                Check Another Symptom
                            </Button>
                            <Link href={'/patient/search'}>
                                <Button>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Book Appointment
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Describe Your Symptoms</CardTitle>
                            <CardDescription>The more details you provide, the more accurate our AI analysis will be</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Symptoms */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">What symptoms are you experiencing?*</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newSymptom}
                                        onChange={(e) => setNewSymptom(e.target.value)}
                                        placeholder="e.g., tooth pain, swelling, bleeding gums"
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

                            {/* Duration */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">How long have you been experiencing these symptoms?</label>
                                <Input
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g., 2 days, 1 week, several months"
                                />
                            </div>

                            {/* Severity */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">How severe are your symptoms?</label>
                                <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MILD">Mild - Noticeable but not interfering with daily activities</SelectItem>
                                        <SelectItem value="MODERATE">Moderate - Causing discomfort and some interference</SelectItem>
                                        <SelectItem value="SEVERE">Severe - Significant pain or major interference</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Additional information (optional)</label>
                                <Textarea
                                    value={additionalInfo}
                                    onChange={(e) => setAdditionalInfo(e.target.value)}
                                    placeholder="Any other details that might be relevant, such as previous dental work, medications, etc."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={analyzeSymptoms} disabled={isAnalyzing || symptoms.length === 0} className="w-full">
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Analyzing Symptoms...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="h-4 w-4 mr-2" />
                                        Analyze Symptoms
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    )
}
