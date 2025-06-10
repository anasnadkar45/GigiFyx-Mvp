"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Building, MapPin, FileText, ImageIcon, Save, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Topbar, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

interface ClinicData {
  id: string
  name: string
  address: string
  phone: string
  email?: string
  description: string
  image?: string
  documents: [string]
  status: string
  city?: string
  state?: string
  zipCode?: string
  website?: string
}

export default function EditClinicPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState<ClinicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
  })

  useEffect(() => {
    fetchClinicData()
  }, [])

  const fetchClinicData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clinic/verification-status")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      if (data.clinic) {
        setClinic(data.clinic)
        setFormData({
          name: data.clinic.name || "",
          description: data.clinic.description || "",
          address: data.clinic.address || "",
          city: data.clinic.city || "",
          state: data.clinic.state || "",
          zipCode: data.clinic.zipCode || "",
          phone: data.clinic.phone || "",
          email: data.clinic.email || "",
          website: data.clinic.website || "",
        })
      }
    } catch (error) {
      console.error("Error fetching clinic data:", error)
      toast.error(`Failed to load clinic data: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clinic) return

    try {
      setSaving(true)
      const response = await fetch(`/api/clinic/${clinic.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status: "APPROVED",
        }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      toast.success("Clinic information updated successfully.")

    } catch (error) {
      console.error("Error updating clinic:", error)
      toast.error(`Failed to update clinic: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSaving(false)
    }
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Clinic Not Found</CardTitle>
            <CardDescription>Unable to load clinic information</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/login">
                <Building className="h-4 w-4 mr-2" />
                Register Clinic
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Topbar>
        <TopbarContent>
          <TopbarTitle>Update Clinic Information</TopbarTitle>
          <TopbarDescription>Update your clinic details and resubmit for verification</TopbarDescription>
        </TopbarContent>
      </Topbar>

      <Wrapper>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Update your clinic's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Clinic Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter clinic name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your clinic and services"
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
              <CardDescription>Update your clinic's location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter street address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    placeholder="Enter zip code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Current Documents
              </CardTitle>
              <CardDescription>Your currently uploaded documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Business Document</h4>
                  <div className="flex flex-wrap gap-6">
                    {clinic.documents.map((documentUrl) => (
                      <Button variant="outline" size="sm" asChild>
                        <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View Current Document
                        </a>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">To update documents, please contact support</p>
                </div>
                {clinic.image && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Clinic Image</h4>
                    <Button variant="outline" size="sm" asChild>
                      <a href={clinic.image} target="_blank" rel="noopener noreferrer">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        View Current Image
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">To update images, please contact support</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/clinic/verification">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Updating..." : "Update & Resubmit"}
            </Button>
          </div>
        </form>
      </Wrapper>
    </>
  )
}
