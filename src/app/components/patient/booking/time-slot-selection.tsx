"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, CalendarDays, X } from "lucide-react"
import { format, addDays, isToday, isTomorrow } from "date-fns"
import { toast } from "sonner"

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

interface Clinic {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
}

interface TimeSlotSelectionProps {
  clinic: Clinic
  service: Service
  onSelectSlot: (slot: TimeSlot, date: Date) => void
}

export function TimeSlotSelection({ clinic, service, onSelectSlot }: TimeSlotSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [bookedSlots, setBookedSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchAvailableSlots = async (date: Date) => {
    setIsLoading(true)
    try {
      const dateString = format(date, "yyyy-MM-dd")
      const response = await fetch(`/api/clinics/${clinic.id}/slots?date=${dateString}&serviceId=${service.id}`)

      if (!response.ok) throw new Error("Failed to fetch slots")

      const data = await response.json()

      // Separate available and booked slots
      const available = data.slots.filter((slot: TimeSlot) => slot.available)
      const booked = data.bookedSlots || [] // Assuming API returns booked slots

      setAvailableSlots(available)
      setBookedSlots(booked)
    } catch (error) {
      console.error("Error fetching slots:", error)
      toast.error("Failed to load available time slots")
      setAvailableSlots([])
      setBookedSlots([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeSlot = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEEE, MMM d")
  }

  // Disable past dates and dates more than 30 days in the future
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    const maxDate = addDays(today, 30)
    return date < today || date > maxDate
  }

  // Combine and sort all slots by time
  const allSlots = [
    ...availableSlots.map((slot) => ({ ...slot, status: "available" as const })),
    ...bookedSlots.map((slot) => ({ ...slot, status: "booked" as const })),
  ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const handleSlotClick = (slot: TimeSlot & { status: "available" | "booked" }) => {
    if (slot.status === "booked") {
      toast.error("This time slot is already booked. Please select another time.")
      return
    }
    onSelectSlot(slot, selectedDate)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Select Date
          </CardTitle>
          <CardDescription>Choose your preferred appointment date</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            disabled={isDateDisabled}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Times
          </CardTitle>
          <CardDescription>
            {selectedDate && (
              <>
                Time slots for <strong>{getDateLabel(selectedDate)}</strong>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : allSlots.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={slot.status === "available" ? "outline" : "ghost"}
                  className={`w-full justify-start h-auto p-4 ${
                    slot.status === "booked" ? "cursor-not-allowed opacity-60 hover:bg-muted" : "hover:bg-accent"
                  }`}
                  onClick={() => handleSlotClick(slot)}
                  disabled={slot.status === "booked"}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-medium ${slot.status === "booked" ? "text-muted-foreground" : ""}`}>
                      {formatTimeSlot(slot.startTime, slot.endTime)}
                    </span>
                    <div className="flex items-center gap-2">
                      {slot.status === "available" ? (
                        <Badge variant="secondary">Available</Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Booked
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Time Slots</h3>
              <p className="text-muted-foreground">
                {selectedDate
                  ? `No time slots available for ${getDateLabel(selectedDate)}. Please try another date.`
                  : "Please select a date to view available time slots."}
              </p>
            </div>
          )}

          {/* Summary */}
          {allSlots.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{availableSlots.length} available</span>
                <span>{bookedSlots.length} booked</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
