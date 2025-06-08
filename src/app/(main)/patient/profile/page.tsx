"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Edit, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

interface PatientProfile {
  id: string
  name: string
  icOrPassport: string
  phone: string
  age: number
  email: string
  address: string
  gender: string
  bloodGroup?: string | null
  allergies?: string | null
  medicalNote?: string | null
  status: string
}

interface UserData {
  id: string
  name: string
  email: string
  image?: string | null
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<PatientProfile>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/patient/profile")
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setProfile(data.profile)
      setUserData(data.user)
      setFormData(data.profile)
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to fetch profile")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? (value ? Number.parseInt(value) : null) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Prepare the data for submission
      const submitData = {
        ...formData,
        // Ensure age is a number if provided
        age: formData.age ? Number(formData.age) : formData.age,
        // Convert empty strings to null for optional fields
        bloodGroup: formData.bloodGroup === "" ? null : formData.bloodGroup,
        allergies: formData.allergies === "" ? null : formData.allergies,
        medicalNote: formData.medicalNote === "" ? null : formData.medicalNote,
        address: formData.address === "" ? null : formData.address,
      }

      console.log("Submitting data:", submitData) // Debug log

      const response = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      setProfile(data.profile)
      setUserData(data.user)
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile || {})
    setIsEditing(false)
  }

  if (loading) {
    return (
      <>
        <Topbar>
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and medical details</p>
          </div>
        </Topbar>
        <Wrapper>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="rounded-full bg-gray-200 h-16 w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </Wrapper>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <Topbar>
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and medical details</p>
          </div>
        </Topbar>
        <Wrapper>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">Profile Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  We couldn't find your patient profile. Please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </Wrapper>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <Topbar>
        <TopbarContent>
          <TopbarTitle>My Profile</TopbarTitle>
          <TopbarDescription>Manage your personal information and medical details</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </TopbarAction>
      </Topbar>

      <Wrapper>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    {userData?.image ? (
                      <AvatarImage src={userData.image || "/placeholder.svg"} alt={profile.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-8 w-8 text-primary" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <p className="text-muted-foreground">{userData?.email || profile.email}</p>
                    <Badge variant={profile.status === "ACTIVE" ? "default" : "secondary"}>{profile.status}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Age:</span>
                    <span className="text-sm font-medium">{profile.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gender:</span>
                    <span className="text-sm font-medium">{profile.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Blood Group:</span>
                    <span className="text-sm font-medium">{profile.bloodGroup || "Not specified"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    {isEditing ? (
                      <Input
                        name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">IC/Passport Number</label>
                    {isEditing ? (
                      <Input
                        name="icOrPassport"
                        value={formData.icOrPassport || ""}
                        onChange={handleInputChange}
                        placeholder="Enter IC or passport number"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{profile.icOrPassport}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    {isEditing ? (
                      <Input
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{profile.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Age</label>
                    {isEditing ? (
                      <Input
                        name="age"
                        type="number"
                        value={formData.age || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your age"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{profile.age} years</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Gender</label>
                    {isEditing ? (
                      <Select
                        value={formData.gender || ""}
                        onValueChange={(value) => handleSelectChange("gender", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{profile.gender}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Blood Group</label>
                    {isEditing ? (
                      <Select
                        value={formData.bloodGroup || ""}
                        onValueChange={(value) => handleSelectChange("bloodGroup", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOT_SPECIFIED">Not specified</SelectItem>
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
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{profile.bloodGroup || "Not specified"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Address</label>
                  {isEditing ? (
                    <Textarea
                      name="address"
                      value={formData.address || ""}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{profile.address || "No address provided"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
                <CardDescription>Important medical details for your dental care</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Allergies</label>
                  {isEditing ? (
                    <Textarea
                      name="allergies"
                      value={formData.allergies || ""}
                      onChange={handleInputChange}
                      placeholder="List any allergies (medications, materials, etc.)"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{profile.allergies || "No known allergies"}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Medical Notes</label>
                  {isEditing ? (
                    <Textarea
                      name="medicalNote"
                      value={formData.medicalNote || ""}
                      onChange={handleInputChange}
                      placeholder="Any additional medical information or conditions"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.medicalNote || "No additional medical notes"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Wrapper>
    </>
  )
}
