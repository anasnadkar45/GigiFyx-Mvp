"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DollarSign, Plus } from "lucide-react"
import { toast } from "sonner"
import { Wrapper } from "@/components/global/Wrapper"
import { Topbar } from "@/components/global/Topbar"
import ServiceForm from "@/components/clinic/forms/ServiceForm"
import type { Service } from "@/app/utils/types"
import { Card, CardContent } from "@/components/ui/card"

export default function ClinicServicesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchServices() {
    try {
      setLoading(true)
      const res = await fetch("/api/clinics/service/my-services")

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Fix: Extract services from the response object
      if (data) {
        setServices(data.services)
      }
    } catch (err) {
      console.error("Error fetching services:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch services")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
    category: "General",
    isActive: "ACTIVE",
  })

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || formData.price <= 0) {
      toast("Please provide a service name and valid price.")
      return
    }

    try {
      const response = await fetch("/api/clinics/service/new-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add service")
      }

      toast.success("Service created successfully")
      setIsAddDialogOpen(false)
      // Reset form data
      setFormData({
        name: "",
        price: 0,
        description: "",
        category: "General",
        isActive: "ACTIVE",
      })
      // Refresh the services list
      fetchServices()
    } catch (error) {
      console.error("Service error:", error)
      toast.error(error instanceof Error ? error.message : "Service creation failed")
    }
  }

  const handleServiceChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  console.log("Services:", services)

  if (loading) {
    return (
      <>
        <Topbar className="justify-between">
          <div>
            <h1 className="font-bold">Services Management</h1>
            <p className="text-muted-foreground text-sm font-medium">
              Manage your clinic services, pricing, and availability
            </p>
          </div>
        </Topbar>
        <Wrapper>
          <div className="flex items-center justify-center h-64">
            <p>Loading services...</p>
          </div>
        </Wrapper>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <Topbar className="justify-between">
        <div>
          <h1 className="font-bold">Services Management</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage your clinic services, pricing, and availability
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Create a new service for your clinic</DialogDescription>
            </DialogHeader>
            <ServiceForm
              service={formData}
              onServiceChange={handleServiceChange}
              onSave={handleAddService}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </Topbar>
      <Wrapper>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <Card key={service.id} className="border">
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{service.category}</p>
                      <p className="text-lg font-bold text-green-600">RM {service.price || 0}</p>
                      <p className="text-sm mt-2">{service.description}</p>
                      <div className="mt-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            service.isActive === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {service.isActive}
                        </span>
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
