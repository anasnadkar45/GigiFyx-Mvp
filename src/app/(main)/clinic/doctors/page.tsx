"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, User, Edit, Trash2, X, Upload } from "lucide-react"
import { toast } from "sonner"
import { Wrapper } from "@/components/global/Wrapper"
import { Topbar, TopbarAction, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { UploadButton } from "@/app/utils/uploadthing"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Doctor {
  id: string
  name: string
  specialization: string
  image?: string
  bio?: string
  experience?: number
  createdAt: string
  updatedAt: string
}

export default function ClinicDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [doctorImage, setDoctorImage] = useState<string>("")
  const [originalImage, setOriginalImage] = useState<string>("")
  const [imageChanged, setImageChanged] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    bio: "",
    experience: "",
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clinic/doctors")
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setDoctors(data.doctors || [])
    } catch (error) {
      console.error("Error fetching doctors:", error)
      toast.error("Failed to fetch doctors")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      specialization: "",
      bio: "",
      experience: "",
    })
    setDoctorImage("")
    setOriginalImage("")
    setImageChanged(false)
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.specialization) {
      toast.error("Name and specialization are required")
      return
    }

    try {
      const response = await fetch("/api/clinic/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          specialization: formData.specialization,
          bio: formData.bio || undefined,
          experience: formData.experience ? Number.parseInt(formData.experience) : undefined,
          image: doctorImage || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add doctor")
      }

      toast.success("Doctor added successfully")
      setIsAddDialogOpen(false)
      resetForm()
      fetchDoctors()
    } catch (error) {
      console.error("Error adding doctor:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add doctor")
    }
  }

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      bio: doctor.bio || "",
      experience: doctor.experience?.toString() || "",
    })
    // Set both current image and original image for comparison
    setDoctorImage(doctor.image || "")
    setOriginalImage(doctor.image || "")
    setImageChanged(false)
    setIsEditDialogOpen(true)
  }

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDoctor || !formData.name || !formData.specialization) {
      toast.error("Name and specialization are required")
      return
    }

    try {
      const response = await fetch(`/api/clinic/doctors/${selectedDoctor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          specialization: formData.specialization,
          bio: formData.bio || undefined,
          experience: formData.experience ? Number.parseInt(formData.experience) : undefined,
          image: doctorImage || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update doctor")
      }

      toast.success("Doctor updated successfully")
      setIsEditDialogOpen(false)
      resetForm()
      setSelectedDoctor(null)
      fetchDoctors()
    } catch (error) {
      console.error("Error updating doctor:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update doctor")
    }
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) {
      return
    }

    try {
      const response = await fetch(`/api/clinic/doctors/${doctorId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete doctor")
      }

      toast.success("Doctor deleted successfully")
      fetchDoctors()
    } catch (error) {
      console.error("Error deleting doctor:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete doctor")
    }
  }

  const handleImageUpload = (url: string) => {
    setDoctorImage(url)
    setImageChanged(true)
    toast.success("Image uploaded successfully")
  }

  const handleRemoveImage = () => {
    setDoctorImage("")
    setImageChanged(true)
  }

  const handleRevertImage = () => {
    setDoctorImage(originalImage)
    setImageChanged(false)
  }

  const handleDialogClose = (dialogType: "add" | "edit") => {
    if (dialogType === "add") {
      setIsAddDialogOpen(false)
    } else {
      setIsEditDialogOpen(false)
    }
    resetForm()
    setSelectedDoctor(null)
  }

  if (loading) {
    return (
      <>
        <Topbar className="justify-between">
          <div>
            <h1 className="font-bold">Doctors Management</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage your clinic's dental professionals</p>
          </div>
        </Topbar>
        <Wrapper>
          <div className="flex items-center justify-center h-64">
            <p>Loading doctors...</p>
          </div>
        </Wrapper>
      </>
    )
  }

  return (
    <>
      <Topbar>
        <TopbarContent>
          <TopbarTitle>Doctors Management</TopbarTitle>
          <TopbarDescription>Manage your clinic's dental professionals</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              if (!open) handleDialogClose("add")
              else setIsAddDialogOpen(true)
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Doctor</DialogTitle>
                <DialogDescription>Add a new dental professional to your clinic</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDoctor} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Dr. John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Specialization *</label>
                  <Input
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Orthodontist"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Years of Experience</label>
                  <Input
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Brief description about the doctor's background and expertise"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Doctor Image</label>
                  <div className="space-y-3">
                    {/* Current Image Preview */}
                    {doctorImage && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={doctorImage || "/placeholder.svg"} />
                            <AvatarFallback className="bg-primary/10">
                              <User className="h-6 w-6 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">Image uploaded</p>
                            <p className="text-xs text-muted-foreground">Ready to save</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Upload Button */}
                    <UploadButton
                      endpoint="fileUploader"
                      onClientUploadComplete={(res) => {
                        handleImageUpload(res[0].url)
                      }}
                      onUploadError={(error: Error) => {
                        console.error("Upload error:", error)
                        toast.error("Upload failed. Please try again.")
                      }}
                      appearance={{
                        button: "bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md w-full",
                        allowedContent: "text-sm text-muted-foreground",
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose("add")}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Doctor</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TopbarAction>
      </Topbar>

      <Wrapper>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{doctors.length}</div>
                <p className="text-xs text-muted-foreground">dental professionals</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Specializations</CardTitle>
                <div className="h-4 w-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs">#</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(doctors.map((d) => d.specialization)).size}</div>
                <p className="text-xs text-muted-foreground">different specialties</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Experience</CardTitle>
                <div className="h-4 w-4 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">★</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {doctors.length > 0
                    ? Math.round(doctors.reduce((sum, d) => sum + (d.experience || 0), 0) / doctors.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">years</p>
              </CardContent>
            </Card>
          </div>

          {/* Doctors List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Doctors ({doctors.length})</CardTitle>
              <CardDescription>Manage your clinic's dental professionals</CardDescription>
            </CardHeader>
            <CardContent>
              {doctors.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No doctors added yet. Add your first doctor to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doctor) => (
                    <Card key={doctor.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4 mb-3">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={doctor.image || "/placeholder.svg"} alt={doctor.name} />
                            <AvatarFallback className="bg-primary/10">
                              <User className="h-8 w-8 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{doctor.name}</h3>
                            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                            {doctor.experience && (
                              <p className="text-xs text-muted-foreground">{doctor.experience} years experience</p>
                            )}
                          </div>
                        </div>

                        {doctor.bio && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{doctor.bio}</p>}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDoctor(doctor)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDoctor(doctor.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Wrapper>

      {/* Edit Doctor Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose("edit")
          else setIsEditDialogOpen(true)
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>Update doctor information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDoctor} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Dr. John Doe"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Specialization *</label>
              <Input
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="Orthodontist"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Years of Experience</label>
              <Input
                name="experience"
                type="number"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="10"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Brief description about the doctor's background and expertise"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Doctor Image</label>
              <div className="space-y-3">
                {/* Current Image Preview */}
                {doctorImage && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={doctorImage || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{imageChanged ? "New image selected" : "Current image"}</p>
                        <p className="text-xs text-muted-foreground">
                          {imageChanged ? "Will be updated on save" : "Existing doctor image"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {imageChanged && originalImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRevertImage}
                          className="text-blue-500 hover:text-blue-700"
                          title="Revert to original"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="text-red-500 hover:text-red-700"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <UploadButton
                  endpoint="fileUploader"
                  onClientUploadComplete={(res) => {
                    handleImageUpload(res[0].url)
                  }}
                  onUploadError={(error: Error) => {
                    console.error("Upload error:", error)
                    toast.error("Upload failed. Please try again.")
                  }}
                  appearance={{
                    button: "bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md w-full",
                    allowedContent: "text-sm text-muted-foreground",
                  }}
                />

                {/* Image Change Indicator */}
                {imageChanged && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    ✓ Image will be updated when you save changes
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => handleDialogClose("edit")}>
                Cancel
              </Button>
              <Button type="submit">Update Doctor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
