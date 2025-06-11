"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { DollarSign, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Wrapper } from "@/components/global/Wrapper"
import {
  Topbar,
  TopbarAction,
  TopbarContent,
  TopbarDescription,
  TopbarTitle,
} from "@/components/global/Topbar"

import type { Service } from "@/app/utils/types"
import ServiceForm from "@/components/clinic/forms/ServiceForm"

export default function ClinicServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Service>({
    name: "",
    price: 0,
    description: "",
    category: "General",
    isActive: "ACTIVE",
    id: "",
    clinicId: "",
    createdAt: "",
    updatedAt: "",
  })

  const fetchServices = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/clinics/service/my-services")
      const data = await res.json()
      setServices(data.services || [])
    } catch (err) {
      setError("Failed to fetch services")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleServiceChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      price: 0,
      description: "",
      category: "General",
      isActive: "ACTIVE",
      id: "",
      clinicId: "",
      createdAt: "",
      updatedAt: "",
    })
    setEditMode(false)
    setEditingServiceId(null)
  }

  const handleSave = async () => {
    try {
      const method = editMode ? "PUT" : "POST"
      const url = editMode
        ? "/api/clinics/service/my-services"
        : "/api/clinics/service/new-service"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMode ? formData : { ...formData, isActive: formData.isActive }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      toast.success(`Service ${editMode ? "updated" : "added"} successfully`)
      setIsDialogOpen(false)
      resetForm()
      fetchServices()
    } catch (err: any) {
      toast.error(err.message || "Error saving service")
    }
  }

  const handleEdit = (service: Service) => {
    setFormData(service)
    setEditingServiceId(service.id)
    setEditMode(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this service?")
    if (!confirmed) return

    try {
      const res = await fetch(`/api/clinics/service/my-services?id=${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")

      toast.success("Service deleted")
      fetchServices()
    } catch (err: any) {
      toast.error(err.message || "Error deleting service")
    }
  }

  return (
    <>
      {/* Header */}
      <Topbar>
        <TopbarContent>
          <TopbarTitle>Services Management</TopbarTitle>
          <TopbarDescription>Manage your clinic services, pricing, and availability</TopbarDescription>
        </TopbarContent>
        <TopbarAction>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Service" : "Add New Service"}</DialogTitle>
                <DialogDescription>{editMode ? "Update your service details" : "Create a new service"}</DialogDescription>
              </DialogHeader>
              <ServiceForm
                service={formData}
                onServiceChange={handleServiceChange}
                onSave={handleSave}
                onCancel={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
                isEdit={editMode}
              />
            </DialogContent>
          </Dialog>
        </TopbarAction>
      </Topbar>
      <Wrapper>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                  <p className="text-2xl font-bold">{services.length}</p>
                </div>
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                  <p className="text-2xl font-bold">{services.filter((s) => s.isActive === "ACTIVE").length}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                  <p className="text-2xl font-bold">
                    RM{" "}
                    {services.length > 0
                      ? Math.round(services.reduce((sum, s) => sum + (s.price || 0), 0) / services.length)
                      : 0}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{new Set(services.map((s) => s.category)).size}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">#</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services List */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Services ({services.length})</h3>
            {services.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No services found. Add your first service to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-sm text-muted-foreground mb-1">{service.category}</p>
                      <p className="text-lg font-bold text-green-600">RM {service.price}</p>
                      <p className="text-sm">{service.description}</p>
                      <p className="mt-2 text-xs text-gray-500">{service.isActive}</p>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
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
