"use client"

import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { BookingConfirmation } from "./booking-confirmation"
import { ClinicList } from "./clinic-list"
import { ServiceSelection } from "./service-selection"
import { TimeSlotSelection } from "./time-slot-selection"
import { Wrapper } from "../global/Wrapper"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  description: string
  image?: string
  services: Array<{
    id: string
    name: string
    price?: number
    category: string
    description?: string
  }>
  doctors: Array<{
    id: string
    name: string
    specialization: string
  }>
  workingHours: Array<{
    day: string
    openTime: string
    closeTime: string
  }>
}

interface Service {
  id: string
  name: string
  price?: number
  category: string
  description?: string
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

type BookingStep = "clinics" | "services" | "slots" | "confirmation"

export function AppointmentBooking() {
  const [currentStep, setCurrentStep] = useState<BookingStep>("clinics")
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setCurrentStep("services")
  }

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
      case "services":
        setCurrentStep("clinics")
        setSelectedClinic(null)
        break
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
    setCurrentStep("clinics")
    setSelectedClinic(null)
    setSelectedService(null)
    setSelectedSlot(null)
    setSelectedDate(null)
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case "clinics":
        return "Choose a Clinic"
      case "services":
        return "Select a Service"
      case "slots":
        return "Pick a Time Slot"
      case "confirmation":
        return "Confirm Booking"
      default:
        return "Book Appointment"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case "clinics":
        return "Browse and select from our approved healthcare providers"
      case "services":
        return `Choose a service from ${selectedClinic?.name}`
      case "slots":
        return `Select your preferred appointment time for ${selectedService?.name}`
      case "confirmation":
        return "Review and confirm your appointment details"
      default:
        return ""
    }
  }

  return (
    <>
      <Wrapper>
        <div>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                {currentStep !== "clinics" && (
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

          {currentStep === "clinics" && <ClinicList onSelectClinic={handleClinicSelect} />}

          {currentStep === "services" && selectedClinic && (
            <ServiceSelection clinic={selectedClinic} onSelectService={handleServiceSelect} />
          )}

          {currentStep === "slots" && selectedClinic && selectedService && (
            <TimeSlotSelection clinic={selectedClinic} service={selectedService} onSelectSlot={handleSlotSelect} />
          )}

          {currentStep === "confirmation" && selectedClinic && selectedService && selectedSlot && selectedDate && (
            <BookingConfirmation
              clinic={selectedClinic}
              service={selectedService}
              slot={selectedSlot}
              date={selectedDate}
              onBookingComplete={handleBookingComplete}
            />
          )}
        </div>
      </Wrapper>
    </>
  )
}
