"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Phone, Badge, Building, MapPin, Calendar, Droplet, FileText, Upload, Info } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const SignupForm = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const role = searchParams?.get("role") || "PATIENT"
    const correctRole = role === "CLINIC" ? "CLINIC_OWNER" : role

    const [isLoading, setIsLoading] = useState(false)
    const [documentFile, setDocumentFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        role: correctRole,
        // Patient fields
        age: "",
        icOrPassport: "",
        phone: "",
        address: "",
        gender: "",
        bloodGroup: "",
        allergies: "",
        medicalNote: "",
        // Clinic fields
        clinicName: "",
        clinicAddress: "",
        clinicPhone: "",
        documentUrl: "",
        description: "",
        // Common
        agreeToTerms: false,
    })

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = "Please agree to the terms and conditions"
        }

        if (correctRole === "PATIENT") {
            if (!formData.icOrPassport.trim()) {
                newErrors.icOrPassport = "IC/Passport is required"
            }
            if (!formData.phone.trim()) {
                newErrors.phone = "Phone number is required"
            }
            if (!formData.address.trim()) {
                newErrors.address = "Address is required"
            }
            if (!formData.gender) {
                newErrors.gender = "Gender is required"
            }
            if (!formData.age.trim()) {
                newErrors.age = "Age is required"
            } else {
                const ageNum = Number.parseInt(formData.age)
                if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
                    newErrors.age = "Please enter a valid age (0-150)"
                }
            }
        }

        if (correctRole === "CLINIC_OWNER") {
            if (!formData.clinicName.trim()) {
                newErrors.clinicName = "Clinic name is required"
            }
            if (!formData.clinicAddress.trim()) {
                newErrors.clinicAddress = "Clinic address is required"
            }
            if (!formData.clinicPhone.trim()) {
                newErrors.clinicPhone = "Clinic phone is required"
            }
            if (!formData.description.trim()) {
                newErrors.description = "Description is required"
            }
            if (!documentFile) {
                newErrors.document = "License document is required"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error("Please fix the errors in the form")
            return
        }

        setIsLoading(true)
        try {
            let documentUrl = ""
            if (documentFile && correctRole === "CLINIC_OWNER") {
                documentUrl = "https://example.com/documents/sample.pdf" // Placeholder
            }

            const response = await fetch("/api/onboard-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    role: correctRole,
                    documentUrl,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to onboard user")
            }

            toast.success(`${correctRole === "CLINIC_OWNER" ? "Clinic" : "Patient"} account created successfully`)
            router.push(correctRole === "CLINIC_OWNER" ? "/clinic/verification" : "/patient/dashboard")
        } catch (error) {
            console.error("Onboarding error:", error)
            toast.error(error instanceof Error ? error.message : "Onboarding failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }))
        }
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
        // Clear error when user selects
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDocumentFile(e.target.files[0])
            // Clear error when file is selected
            if (errors.document) {
                setErrors((prev) => ({ ...prev, document: "" }))
            }
        }
    }

    return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
                    <CardDescription>
                        {correctRole === "CLINIC_OWNER"
                            ? "Register your clinic to manage appointments"
                            : "Complete your profile to start booking appointments"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {correctRole === "CLINIC_OWNER" ? renderClinicForm() : renderPatientForm()}

                        {/* Terms checkbox */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={formData.agreeToTerms}
                                    onCheckedChange={(checked) => {
                                        setFormData((prev) => ({ ...prev, agreeToTerms: checked as boolean }))
                                        if (errors.agreeToTerms) {
                                            setErrors((prev) => ({ ...prev, agreeToTerms: "" }))
                                        }
                                    }}
                                />
                                <Label htmlFor="terms" className="text-sm">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-primary hover:underline">
                                        Terms
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Privacy Policy
                                    </Link>
                                </Label>
                            </div>
                            {errors.agreeToTerms && <p className="text-sm text-red-500">{errors.agreeToTerms}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Submitting..." : "Complete Onboarding"}
                        </Button>
                    </form>

                    <Separator className="my-6" />

                    <div className="text-center text-sm">
                        Want to change your role?{" "}
                        <Link
                            href={`/sign-up?role=${correctRole === "CLINIC_OWNER" ? "PATIENT" : "CLINIC"}`}
                            className="text-primary hover:underline"
                        >
                            Switch to {correctRole === "CLINIC_OWNER" ? "Patient" : "Clinic"} Onboarding
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    function renderPatientForm() {
        return (
            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal">Personal Information</TabsTrigger>
                    <TabsTrigger value="medical">Medical Information</TabsTrigger>
                </TabsList>
                <TabsContent value="personal" className="space-y-4 pt-4">
                    <InputWithIcon
                        label="IC / Passport"
                        id="icOrPassport"
                        name="icOrPassport"
                        icon={<Badge className="h-4 w-4" />}
                        value={formData.icOrPassport}
                        onChange={handleInputChange}
                        error={errors.icOrPassport}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <InputWithIcon
                            label="Age"
                            id="age"
                            name="age"
                            icon={<Calendar className="h-4 w-4" />}
                            value={formData.age}
                            onChange={handleInputChange}
                            type="number"
                            error={errors.age}
                            required
                        />
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender *</Label>
                            <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                                <SelectTrigger id="gender" className={errors.gender ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MALE">Male</SelectItem>
                                    <SelectItem value="FEMALE">Female</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                        </div>
                    </div>
                    <InputWithIcon
                        label="Phone Number"
                        id="phone"
                        name="phone"
                        icon={<Phone className="h-4 w-4" />}
                        value={formData.phone}
                        onChange={handleInputChange}
                        error={errors.phone}
                        required
                    />
                    <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <Textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className={`pl-10 min-h-[80px] ${errors.address ? "border-red-500" : ""}`}
                                required
                            />
                        </div>
                        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                    </div>
                </TabsContent>
                <TabsContent value="medical" className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <div className="relative">
                            <Select value={formData.bloodGroup} onValueChange={(value) => handleSelectChange("bloodGroup", value)}>
                                <SelectTrigger id="bloodGroup" className="pl-10">
                                    <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A+">A+</SelectItem>
                                    <SelectItem value="A-">A-</SelectItem>
                                    <SelectItem value="B+">B+</SelectItem>
                                    <SelectItem value="B-">B-</SelectItem>
                                    <SelectItem value="AB+">AB+</SelectItem>
                                    <SelectItem value="AB-">AB-</SelectItem>
                                    <SelectItem value="O+">O+</SelectItem>
                                    <SelectItem value="O-">O-</SelectItem>
                                </SelectContent>
                            </Select>
                            <Droplet className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="allergies">Allergies</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <Info className="h-4 w-4" />
                            </div>
                            <Textarea
                                id="allergies"
                                name="allergies"
                                value={formData.allergies}
                                onChange={handleInputChange}
                                placeholder="List any allergies you have, or type 'None' if none"
                                className="pl-10 min-h-[80px]"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="medicalNote">Medical Notes</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <FileText className="h-4 w-4" />
                            </div>
                            <Textarea
                                id="medicalNote"
                                name="medicalNote"
                                value={formData.medicalNote}
                                onChange={handleInputChange}
                                placeholder="Any important medical information we should know"
                                className="pl-10 min-h-[100px]"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        )
    }

    function renderClinicForm() {
        return (
            <div className="space-y-4">
                <InputWithIcon
                    label="Clinic Name"
                    id="clinicName"
                    name="clinicName"
                    icon={<Building className="h-4 w-4" />}
                    value={formData.clinicName}
                    onChange={handleInputChange}
                    error={errors.clinicName}
                    required
                />
                <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Clinic Address *</Label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <Textarea
                            id="clinicAddress"
                            name="clinicAddress"
                            value={formData.clinicAddress}
                            onChange={handleInputChange}
                            className={`pl-10 min-h-[80px] ${errors.clinicAddress ? "border-red-500" : ""}`}
                            required
                        />
                    </div>
                    {errors.clinicAddress && <p className="text-sm text-red-500">{errors.clinicAddress}</p>}
                </div>
                <InputWithIcon
                    label="Clinic Phone"
                    id="clinicPhone"
                    name="clinicPhone"
                    icon={<Phone className="h-4 w-4" />}
                    value={formData.clinicPhone}
                    onChange={handleInputChange}
                    error={errors.clinicPhone}
                    required
                />
                <div className="space-y-2">
                    <Label htmlFor="description">Clinic Description *</Label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                            <Info className="h-4 w-4" />
                        </div>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Tell us about your clinic, services offered, etc."
                            className={`pl-10 min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
                            required
                        />
                    </div>
                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="document">License Document *</Label>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Input
                                    id="document"
                                    type="file"
                                    onChange={handleFileChange}
                                    className={`pl-10 ${errors.document ? "border-red-500" : ""}`}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    required
                                />
                                <Upload className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        {documentFile && <div className="text-sm text-green-600">File selected: {documentFile.name}</div>}
                    </div>
                    {errors.document && <p className="text-sm text-red-500">{errors.document}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                        Please upload your clinic license or registration document (PDF, JPG, PNG)
                    </p>
                </div>
            </div>
        )
    }
}

// Updated InputWithIcon component with error handling
function InputWithIcon({
    label,
    id,
    name,
    icon,
    value,
    onChange,
    type = "text",
    required = false,
    error,
}: {
    label: string
    id: string
    name: string
    icon: React.ReactNode
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    type?: string
    required?: boolean
    error?: string
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label} {required && "*"}
            </Label>
            <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">{icon}</div>
                <Input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    className={`pl-10 ${error ? "border-red-500" : ""}`}
                    required={required}
                />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    )
}

