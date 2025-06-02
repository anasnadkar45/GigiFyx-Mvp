"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { MapPin, Star, Clock, Search } from "lucide-react"
import { toast } from "sonner"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  description: string
  averageRating: number
  totalReviews: number
  services: Service[]
  workingHours: WorkingHour[]
}

interface Service {
  id: string
  name: string
  description: string
  price: number
  category: string
  duration: number
}

interface WorkingHour {
  day: string
  openTime: string
  closeTime: string
  duration: number
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

export function AppointmentBooking() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [patientDescription, setPatientDescription] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    fetchClinics()
  }, [])

  useEffect(() => {
    if (selectedClinic && selectedService && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedClinic, selectedService, selectedDate])

  const fetchClinics = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clinics/list")
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setClinics(data.clinics || [])
    } catch (error) {
      console.error("Error fetching clinics:", error)
      toast.error("Failed to fetch clinics")
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedClinic || !selectedService || !selectedDate) return

    try {
      const dateStr = selectedDate.toISOString().split("T")[0]
      const response = await fetch(
        `/api/clinics/${selectedClinic.id}/slots?date=${dateStr}&serviceId=${selectedService.id}`,
      )
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error("Error fetching slots:", error)
      toast.error("Failed to fetch available slots")
    }
  }

  const bookAppointment = async () => {
    if (!selectedClinic || !selectedService || !selectedSlot) {
      toast.error("Please select all required fields")
      return
    }

    try {
      setBookingLoading(true)
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinicId: selectedClinic.id,
          serviceId: selectedService.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          patientDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment")
      }

      toast.success("Appointment booked successfully!")

      // Reset form
      setSelectedClinic(null)
      setSelectedService(null)
      setSelectedDate(new Date())
      setSelectedSlot(null)
      setPatientDescription("")
      setStep(1)
    } catch (error) {
      console.error("Error booking appointment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to book appointment")
    } finally {
      setBookingLoading(false)
    }
  }

  const filteredClinics = clinics.filter(
    (clinic) =>
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p>Loading clinics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Your Appointment</h1>
        <p className="text-muted-foreground">Find and book with the best dental clinics</p>
      </div>

      {/* Step 1: Select Clinic */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose a Clinic</CardTitle>
            <CardDescription>Select from our verified dental clinics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clinics by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClinics.map((clinic) => (
                <Card
                  key={clinic.id}
                  className={`cursor-pointer transition-colors ${
                    selectedClinic?.id === clinic.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedClinic(clinic)
                    setSelectedService(null)
                    setSelectedSlot(null)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{clinic.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{clinic.averageRating}</span>
                        <span className="text-xs text-muted-foreground">({clinic.totalReviews})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {clinic.address}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{clinic.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {clinic.services.slice(0, 3).map((service) => (
                        <Badge key={service.id} variant="secondary" className="text-xs">
                          {service.name}
                        </Badge>
                      ))}
                      {clinic.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{clinic.services.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedClinic && (
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>Next: Select Service</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Service */}
      {step === 2 && selectedClinic && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 2: Choose a Service</CardTitle>
                <CardDescription>Select the service you need at {selectedClinic.name}</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedClinic.services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-colors ${
                    selectedService?.id === service.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedService(service)
                    setSelectedSlot(null)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      <div className="text-right">
                        <div className="font-semibold text-primary">RM {service.price}</div>
                        <div className="text-xs text-muted-foreground">{service.duration} min</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="mb-2">
                      {service.category}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedService && (
              <div className="flex justify-end">
                <Button onClick={() => setStep(3)}>Next: Select Date & Time</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Date & Time */}
      {step === 3 && selectedClinic && selectedService && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 3: Choose Date & Time</CardTitle>
                <CardDescription>Select your preferred appointment slot</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Select Date</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  className="rounded-md border"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-4">Available Times</h3>
                {selectedDate ? (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {availableSlots.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        No available slots for this date
                      </div>
                    ) : (
                      availableSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSlot(slot)}
                          className="justify-start"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {new Date(slot.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Button>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Please select a date first</p>
                )}
              </div>
            </div>

            {selectedSlot && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Additional Notes (Optional)</label>
                  <Textarea
                    placeholder="Describe your symptoms or any special requirements..."
                    value={patientDescription}
                    onChange={(e) => setPatientDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setStep(4)}>Review Booking</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 4 && selectedClinic && selectedService && selectedSlot && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 4: Review & Confirm</CardTitle>
                <CardDescription>Please review your appointment details</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Clinic Details</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium">{selectedClinic.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedClinic.address}</p>
                    <p className="text-sm text-muted-foreground">{selectedClinic.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Service Details</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium">{selectedService.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm">Duration:</span>
                      <span className="text-sm font-medium">{selectedService.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Price:</span>
                      <span className="text-sm font-medium">RM {selectedService.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Appointment Details</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Date:</span>
                      <span className="text-sm font-medium">{selectedDate?.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Time:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedSlot.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(selectedSlot.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {patientDescription && (
                      <div className="mt-3">
                        <span className="text-sm font-medium">Notes:</span>
                        <p className="text-sm text-muted-foreground mt-1">{patientDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-primary">RM {selectedService.price}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={bookAppointment} disabled={bookingLoading} size="lg">
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
