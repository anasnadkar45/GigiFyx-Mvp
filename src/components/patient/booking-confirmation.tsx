"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, MapPin, Clock, DollarSign, User, Loader2, Info, Phone, Mail } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  email?: string
}

interface Service {
  id: string
  name: string
  price?: number
  category: string
  duration?: number
  preparation?: string
}

interface TimeSlot {
  startTime: string
  endTime: string
}

interface BookingConfirmationProps {
  clinic: Clinic
  service: Service
  slot: TimeSlot
  date: Date
  onBookingComplete: () => void
}

export function BookingConfirmation({ clinic, service, slot, date, onBookingComplete }: BookingConfirmationProps) {
  const [patientDescription, setPatientDescription] = useState("")
  const [isBooking, setIsBooking] = useState(false)
  const [isBooked, setIsBooked] = useState(false)

  const formatTimeSlot = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
  }

  const handleBooking = async () => {
    setIsBooking(true)

    try {
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinicId: clinic.id,
          serviceId: service.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          patientDescription: patientDescription.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to book appointment")
      }

      const result = await response.json()
      setIsBooked(true)
      toast.success("Appointment booked successfully!")

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        onBookingComplete()
      }, 3000)
    } catch (error) {
      console.error("Error booking appointment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to book appointment")
    } finally {
      setIsBooking(false)
    }
  }

  if (isBooked) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground text-center mb-6">
            Your appointment has been successfully booked. You will receive a confirmation notification shortly.
          </p>
          <div className="text-center space-y-2 mb-6">
            <p className="text-sm">
              <strong>Appointment ID:</strong> Will be provided in confirmation
            </p>
            <p className="text-sm">
              <strong>Status:</strong> <Badge variant="secondary">Booked</Badge>
            </p>
          </div>
          <Button onClick={onBookingComplete}>Book Another Appointment</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Summary</CardTitle>
          <CardDescription>Please review your booking details before confirming</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clinic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{clinic.name}</span>
            </div>
            <div className="ml-6 space-y-1">
              <p className="text-sm text-muted-foreground">{clinic.address}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{clinic.phone}</span>
              </div>
              {clinic.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{clinic.email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Service Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{service.name}</span>
              <Badge variant="secondary">{service.category}</Badge>
            </div>
            <div className="ml-6 space-y-2">
              {service.price && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${service.price}</span>
                </div>
              )}
              {service.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{service.duration} minutes</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{format(date, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">{formatTimeSlot(slot.startTime, slot.endTime)}</p>
          </div>

          {/* Payment Info */}
          {service.price && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Payment Information</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Service Fee:</span>
                    <span className="font-medium">${service.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Payment will be processed at the clinic. Please bring a valid payment method.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preparation Instructions */}
      {service.preparation && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Preparation Instructions:</strong> {service.preparation}
          </AlertDescription>
        </Alert>
      )}

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Any specific concerns or notes for your appointment (optional)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please describe your symptoms, concerns, or any specific requests..."
              value={patientDescription}
              onChange={(e) => setPatientDescription(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleBooking} disabled={isBooking} className="w-full" size="lg">
            {isBooking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking Appointment...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            By confirming, you agree to the clinic's terms and conditions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
