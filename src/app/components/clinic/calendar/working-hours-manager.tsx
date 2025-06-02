"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Clock, Save, RotateCcw, Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"

interface WorkingHour {
  day: DayOfWeek
  openTime: string
  closeTime: string
  duration: number
  isEnabled: boolean
}

interface BackendWorkingHour {
  id: string
  day: DayOfWeek
  openTime: string
  closeTime: string
  duration: number
  clinicId: string
  createdAt: string
  updatedAt: string
}

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
]

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
]

const getDefaultWorkingHours = (): WorkingHour[] => {
  return DAYS.map((day) => ({
    day: day.value,
    openTime: "09:00",
    closeTime: "17:00",
    duration: 30,
    isEnabled: day.value !== "SATURDAY" && day.value !== "SUNDAY",
  }))
}

export function WorkingHoursManager() {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(getDefaultWorkingHours())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasExistingData, setHasExistingData] = useState(false)

  // Fetch existing working hours on component mount
  useEffect(() => {
    fetchWorkingHours()
  }, [])

  const fetchWorkingHours = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/clinics/working-hours", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch working hours")
      }

      const data = await response.json()
      const existingHours: BackendWorkingHour[] = data.workingHours

      if (existingHours && existingHours.length > 0) {
        // Convert backend data to frontend format
        const convertedHours = DAYS.map((day) => {
          const existingHour = existingHours.find((h) => h.day === day.value)
          if (existingHour) {
            return {
              day: day.value,
              openTime: existingHour.openTime,
              closeTime: existingHour.closeTime,
              duration: existingHour.duration,
              isEnabled: true,
            }
          }
          // Return default for days not in database
          return {
            day: day.value,
            openTime: "09:00",
            closeTime: "17:00",
            duration: 30,
            isEnabled: false,
          }
        })

        setWorkingHours(convertedHours)
        setHasExistingData(true)
        toast.success(`Loaded existing working hours for ${existingHours.length} days`)
      } else {
        // No existing data, use defaults
        setWorkingHours(getDefaultWorkingHours())
        setHasExistingData(false)
      }
    } catch (error) {
      console.error("Error fetching working hours:", error)
      toast.error("Failed to load working hours. Using default values.")
      setWorkingHours(getDefaultWorkingHours())
      setHasExistingData(false)
    } finally {
      setIsLoading(false)
    }
  }

  const updateWorkingHour = (dayIndex: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours((prev) => prev.map((hour, index) => (index === dayIndex ? { ...hour, [field]: value } : hour)))
  }

  const validateTimeRange = (openTime: string, closeTime: string): boolean => {
    const [openHour, openMin] = openTime.split(":").map(Number)
    const [closeHour, closeMin] = closeTime.split(":").map(Number)

    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin

    return closeMinutes > openMinutes
  }

  const saveWorkingHours = async () => {
    setIsSaving(true)

    try {
      // Validate enabled days
      const enabledHours = workingHours.filter((hour) => hour.isEnabled)

      if (enabledHours.length === 0) {
        toast.error("Please enable at least one working day.")
        return
      }

      // Validate time ranges
      for (const hour of enabledHours) {
        if (!validateTimeRange(hour.openTime, hour.closeTime)) {
          toast.error(
            `Invalid time range for ${DAYS.find((d) => d.value === hour.day)?.label}. Close time must be after open time.`,
          )
          return
        }
      }

      // Send all working hours in a single request
      const response = await fetch("/api/clinics/working-hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workingHours: enabledHours.map((hour) => ({
            day: hour.day,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            duration: hour.duration,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save working hours")
      }

      const result = await response.json()
      setHasExistingData(true)
      toast.success(`Working hours saved successfully! ${result.count} days configured.`)
    } catch (error) {
      console.error("Error saving working hours:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save working hours")
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefaults = () => {
    setWorkingHours(getDefaultWorkingHours())
    toast.success("Working hours reset to default values.")
  }

  const refreshData = () => {
    fetchWorkingHours()
  }

  const getWorkingSummary = () => {
    const enabledDays = workingHours.filter((hour) => hour.isEnabled)
    return {
      totalDays: enabledDays.length,
      totalHours: enabledDays.reduce((total, hour) => {
        const [openHour, openMin] = hour.openTime.split(":").map(Number)
        const [closeHour, closeMin] = hour.closeTime.split(":").map(Number)
        const openMinutes = openHour * 60 + openMin
        const closeMinutes = closeHour * 60 + closeMin
        return total + (closeMinutes - openMinutes) / 60
      }, 0),
    }
  }

  const summary = getWorkingSummary()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Working Hours Overview</CardTitle>
              {hasExistingData && <Badge variant="secondary">Configured</Badge>}
              {!hasExistingData && <Badge variant="outline">Not Set</Badge>}
            </div>
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {hasExistingData
              ? "Your clinic's current operating hours and appointment durations"
              : "Configure your clinic's operating hours and appointment durations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Badge variant="secondary">{summary.totalDays} working days</Badge>
            <Badge variant="secondary">{summary.totalHours.toFixed(1)} hours per week</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Schedule</CardTitle>
          <CardDescription>
            {hasExistingData
              ? "Modify your existing schedule or add new working days"
              : "Set your operating hours for each day of the week"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {workingHours.map((hour, index) => {
            const dayLabel = DAYS.find((d) => d.value === hour.day)?.label || hour.day
            const isValidTime = validateTimeRange(hour.openTime, hour.closeTime)

            return (
              <div key={hour.day} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={hour.isEnabled}
                      onCheckedChange={(checked) => updateWorkingHour(index, "isEnabled", checked)}
                    />
                    <Label className="text-base font-medium">{dayLabel}</Label>
                    {!isValidTime && hour.isEnabled && (
                      <Badge variant="destructive" className="text-xs">
                        Invalid time range
                      </Badge>
                    )}
                  </div>
                </div>

                {hour.isEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-8">
                    <div className="space-y-2">
                      <Label htmlFor={`open-${hour.day}`}>Open Time</Label>
                      <Input
                        id={`open-${hour.day}`}
                        type="time"
                        value={hour.openTime}
                        onChange={(e) => updateWorkingHour(index, "openTime", e.target.value)}
                        className={!isValidTime ? "border-red-500" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`close-${hour.day}`}>Close Time</Label>
                      <Input
                        id={`close-${hour.day}`}
                        type="time"
                        value={hour.closeTime}
                        onChange={(e) => updateWorkingHour(index, "closeTime", e.target.value)}
                        className={!isValidTime ? "border-red-500" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`duration-${hour.day}`}>Appointment Duration</Label>
                      <Select
                        value={hour.duration.toString()}
                        onValueChange={(value) => updateWorkingHour(index, "duration", Number.parseInt(value))}
                      >
                        <SelectTrigger id={`duration-${hour.day}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={saveWorkingHours} disabled={isSaving} className="flex items-center gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : hasExistingData ? "Update Working Hours" : "Save Working Hours"}
        </Button>

        <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
