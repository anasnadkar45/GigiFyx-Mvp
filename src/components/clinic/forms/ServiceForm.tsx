"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"
import { SubmitButton } from "@/components/global/Buttons"
import type { Service } from "@/app/utils/types"

interface ServiceFormProps {
  service: Service
  onServiceChange: (field: string, value: any) => void
  onSave: () => void
  onCancel: () => void
  isEdit?: boolean
}

const categories = ["General", "Cosmetic", "Specialized", "Emergency", "Pediatric", "Orthodontics"]

export default function ServiceForm({ service, onServiceChange, onSave, onCancel, isEdit = false }: ServiceFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="service-name">Service Name *</Label>
          <Input
            id="service-name"
            name="name"
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
            name="price"
            type="number"
            value={service.price}
            onChange={(e) => onServiceChange("price", Number(e.target.value))}
            placeholder="e.g., 150"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-description">Description</Label>
        <Textarea
          id="service-description"
          name="description"
          value={service.description}
          onChange={(e) => onServiceChange("description", e.target.value)}
          placeholder="Describe the service, what it includes, and any special notes..."
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="service-active"
          checked={service.isActive === "ACTIVE"}
          onCheckedChange={(checked) => onServiceChange("isActive", checked ? "ACTIVE" : "INACTIVE")}
        />
        <Label htmlFor="service-active">Service is active and bookable</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <SubmitButton onClick={onSave} text="Add Service" />
      </div>
    </div>
  )
}
