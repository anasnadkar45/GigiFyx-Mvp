"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Clock, Users, Star, Phone, Mail, Award } from "lucide-react"
import { toast } from "sonner"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  email?: string
  description: string
  image?: string
  city?: string
  state?: string
  averageRating: number
  totalReviews: number
  totalCompletedAppointments: number
  services: Array<{
    id: string
    name: string
    price?: number
    category: string
    description?: string
    duration?: number
    preparation?: string
  }>
  doctors: Array<{
    id: string
    name: string
    specialization: string
    image?: string
    bio?: string
    experience?: number
  }>
  workingHours: Array<{
    day: string
    openTime: string
    closeTime: string
    duration: number
    breakStartTime?: string
    breakEndTime?: string
  }>
}

interface ClinicListProps {
  onSelectClinic: (clinic: Clinic) => void
}

export function ClinicList({ onSelectClinic }: ClinicListProps) {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchClinics()
  }, [])

  const fetchClinics = async () => {
    try {
      const response = await fetch("/api/clinics/public")
      if (!response.ok) throw new Error("Failed to fetch clinics")

      const data = await response.json()
      setClinics(data.clinics)
    } catch (error) {
      console.error("Error fetching clinics:", error)
      toast.error("Failed to load clinics")
    } finally {
      setIsLoading(false)
    }
  }

  const getWorkingDays = (workingHours: Clinic["workingHours"]) => {
    return workingHours.length > 0 ? `${workingHours.length} days/week` : "Hours not set"
  }

  const renderRating = (rating: number, totalReviews: number) => {
    if (totalReviews === 0) {
      return <Badge variant="outline">New Clinic</Badge>
    }

    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rating}</span>
        <span className="text-xs text-muted-foreground">({totalReviews})</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (clinics.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Clinics Available</h3>
          <p className="text-muted-foreground text-center">
            There are currently no approved clinics available for booking.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {clinics.map((clinic) => (
        <Card key={clinic.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{clinic.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {clinic.address}
                  {clinic.city && clinic.state && (
                    <span className="text-xs">
                      • {clinic.city}, {clinic.state}
                    </span>
                  )}
                </CardDescription>
              </div>
              {renderRating(clinic.averageRating, clinic.totalReviews)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2">{clinic.description}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{clinic.doctors.length} doctors</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{getWorkingDays(clinic.workingHours)}</span>
              </div>
              {clinic.totalCompletedAppointments > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>{clinic.totalCompletedAppointments} completed appointments</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Contact:</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{clinic.phone}</span>
                </div>
                {clinic.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{clinic.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <div className="flex flex-wrap gap-1">
                {clinic.services.slice(0, 3).map((service) => (
                  <Badge key={service.id} variant="outline" className="text-xs">
                    {service.name}
                    {service.price && <span className="ml-1">${service.price}</span>}
                  </Badge>
                ))}
                {clinic.services.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{clinic.services.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            <Button onClick={() => onSelectClinic(clinic)} className="w-full">
              Book Appointment
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
