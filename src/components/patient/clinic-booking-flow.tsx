"use client"

import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ServiceSelection } from "@/components/patient/service-selection"
import { TimeSlotSelection } from "@/components/patient/time-slot-selection"
import { BookingConfirmation } from "@/components/patient/booking-confirmation"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  email?: string
  description: string
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

interface Service {
  id: string
  name: string
  price?: number
  category: string
  description?: string
  duration?: number
  preparation?: string
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

type BookingStep = "services" | "slots" | "confirmation"

interface ClinicBookingFlowProps {
  clinic: Clinic
}

export function ClinicBookingFlow({ clinic }: ClinicBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>("services")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setCurrentStep("slots")
  }

  const handleSlotSelect = (slot: TimeSlot, date: Date) => {
    setSelectedSlot(slot)
    setSelectedDate(date)
    setCurrentStep("confirmation")
  }

  const handleBack = () => {
    switch (currentStep) {
      case "slots":
        setCurrentStep("services")
        setSelectedService(null)
        break
      case "confirmation":
        setCurrentStep("slots")
        setSelectedSlot(null)
        setSelectedDate(null)
        break
    }
  }

  const handleBookingComplete = () => {
    // Reset to initial state
    setCurrentStep("services")
    setSelectedService(null)
    setSelectedSlot(null)
    setSelectedDate(null)
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case "services":
        return "Select a Service"
      case "slots":
        return "Choose Your Time"
      case "confirmation":
        return "Confirm Booking"
      default:
        return "Book Appointment"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case "services":
        return `Choose a service from ${clinic.name}`
      case "slots":
        return `Select your preferred appointment time for ${selectedService?.name}`
      case "confirmation":
        return "Review and confirm your appointment details"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {currentStep !== "services" && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle>{getStepTitle()}</CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {currentStep === "services" && <ServiceSelection clinic={clinic} onSelectService={handleServiceSelect} />}

      {currentStep === "slots" && selectedService && (
        <TimeSlotSelection clinic={clinic} service={selectedService} onSelectSlot={handleSlotSelect} />
      )}

      {currentStep === "confirmation" && selectedService && selectedSlot && selectedDate && (
        <BookingConfirmation
          clinic={clinic}
          service={selectedService}
          slot={selectedSlot}
          date={selectedDate}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  )
}
