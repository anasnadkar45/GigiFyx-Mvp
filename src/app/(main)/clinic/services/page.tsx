"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Clock, DollarSign, Edit, Filter, Plus, Save, Search, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Wrapper } from "@/components/global/Wrapper"
import { Topbar } from "@/components/global/Topbar"

interface Service {
  id: string
  name: string
  price: number
  duration: number
  description: string
  category: string
  isActive: boolean
  popularity: number
}

export default function ClinicServicesPage() {
  const [services, setServices] = useState<Service[]>()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [newService, setNewService] = useState({
    name: "",
    price: 0,
    duration: 30,
    description: "",
    category: "General",
    isActive: true,
  })

  const categories = ["General", "Cosmetic", "Specialized", "Emergency", "Pediatric", "Orthodontics"]

  //   const filteredServices = services.filter((service) => {
  //     const matchesSearch =
  //       service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       service.description.toLowerCase().includes(searchTerm.toLowerCase())
  //     const matchesCategory = categoryFilter === "all" || service.category === categoryFilter
  //     const matchesStatus =
  //       statusFilter === "all" ||
  //       (statusFilter === "active" && service.isActive) ||
  //       (statusFilter === "inactive" && !service.isActive)

  //     return matchesSearch && matchesCategory && matchesStatus
  //   })

  const handleAddService = () => {
    if (!newService.name || newService.price <= 0) {
      toast("Please provide a service name and valid price.")
      return
    }

    const serviceId = `service-${Date.now()}`
    const service: Service = {
      id: serviceId,
      name: newService.name,
      price: newService.price,
      duration: newService.duration,
      description: newService.description,
      category: newService.category,
      isActive: newService.isActive,
      popularity: 0,
    }
    setNewService({
      name: "",
      price: 0,
      duration: 30,
      description: "",
      category: "General",
      isActive: true,
    })
    setIsAddDialogOpen(false)

    toast(`${newService.name} has been added to your services.`)
  }

  //   const handleEditService = () => {
  //     if (!selectedService) return

  //     setServices((prev) => prev.map((service) => (service.id === selectedService.id ? selectedService : service)))
  //     setIsEditDialogOpen(false)
  //     setSelectedService(null)

  //     toast("The service has been updated successfully.")
  //   }

  //   const handleDeleteService = (id: string) => {
  //     setServices((prev) => prev.filter((service) => service.id !== id))
  //     toast("The service has been removed from your list.")
  //   }

  //   const handleToggleStatus = (id: string, isActive: boolean) => {
  //     setServices((prev) => prev.map((service) => (service.id === id ? { ...service, isActive } : service)))
  //     toast(`The service has been ${isActive ? "activated" : "deactivated"}.`)
  //   }

  const ServiceForm = ({
    service,
    onServiceChange,
    onSave,
    onCancel,
    isEdit = false,
  }: {
    service: any
    onServiceChange: (field: string, value: any) => void
    onSave: () => void
    onCancel: () => void
    isEdit?: boolean
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="service-name">Service Name *</Label>
          <Input
            id="service-name"
            value={service.name}
            onChange={(e) => onServiceChange("name", e.target.value)}
            placeholder="e.g., Teeth Whitening"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-category">Category *</Label>
          <Select value={service.category} onValueChange={(value) => onServiceChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-price">Price (RM) *</Label>
          <Input
            id="service-price"
            type="number"
            value={service.price}
            onChange={(e) => onServiceChange("price", Number(e.target.value))}
            placeholder="e.g., 150"
            min="0"
            step="0.01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-duration">Duration (minutes) *</Label>
          <Select
            value={String(service.duration)}
            onValueChange={(value) => onServiceChange("duration", Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
              <SelectItem value="120">120 minutes</SelectItem>
              <SelectItem value="180">180 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-description">Description</Label>
        <Textarea
          id="service-description"
          value={service.description}
          onChange={(e) => onServiceChange("description", e.target.value)}
          placeholder="Describe the service, what it includes, and any special notes..."
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="service-active"
          checked={service.isActive}
          onCheckedChange={(checked) => onServiceChange("isActive", checked)}
        />
        <Label htmlFor="service-active">Service is active and bookable</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          {isEdit ? "Update Service" : "Add Service"}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Header */}
      <Topbar className='justify-between'>
        <div>
          <h1 className="font-bold">Services Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage your clinic services, pricing, and availability</p>
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
              service={newService}
              onServiceChange={(field, value) => setNewService((prev) => ({ ...prev, [field]: value }))}
              onSave={handleAddService}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </Topbar>
      <Wrapper >

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-2xl font-bold">{services.filter((s) => s.isActive).length}</p>
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
                      ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length)
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
        </div> */}

        {/* Filters */}
        {/* <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search services by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card> */}

        {/* Services Table */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Services ({filteredServices.length})</CardTitle>
            <CardDescription>Manage your clinic services and pricing</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No services found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "Add your first service to start accepting bookings"}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Popularity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">RM {service.price}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{service.duration} min</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={service.isActive}
                            onCheckedChange={(checked) => handleToggleStatus(service.id, checked)}
                          />
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${service.popularity}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground">{service.popularity}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(service)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteService(service.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card> */}

        {/* Edit Service Dialog */}
        {/* <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>Update service details and pricing</DialogDescription>
            </DialogHeader>
            {selectedService && (
              <ServiceForm
                service={selectedService}
                onServiceChange={(field, value) =>
                  setSelectedService((prev) => (prev ? { ...prev, [field]: value } : null))
                }
                onSave={handleEditService}
                onCancel={() => {
                  setIsEditDialogOpen(false)
                  setSelectedService(null)
                }}
                isEdit={true}
              />
            )}
          </DialogContent>
        </Dialog> */}
      </Wrapper>
    </>
  )
}
