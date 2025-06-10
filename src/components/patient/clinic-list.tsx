"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Clock,
  Users,
  Star,
  Phone,
  Mail,
  Award,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"

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
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Search states
  const [searchLocation, setSearchLocation] = useState("")
  const [searchService, setSearchService] = useState("")

  // Filter states
  const [priceRangeState, setPriceRange] = useState([0, 1000])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<string>("rating-desc")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])

  // Get unique services and specializations for filter options
  const uniqueServices = useMemo(() => {
    const services = new Set<string>()
    clinics.forEach((clinic) => {
      clinic.services.forEach((service) => {
        services.add(service.name)
      })
    })
    return Array.from(services).sort()
  }, [clinics])

  const uniqueSpecializations = useMemo(() => {
    const specializations = new Set<string>()
    clinics.forEach((clinic) => {
      clinic.doctors.forEach((doctor) => {
        if (doctor.specialization) {
          specializations.add(doctor.specialization)
        }
      })
    })
    return Array.from(specializations).sort()
  }, [clinics])

  // Get min and max price from all services
  const initialPriceRange = useMemo(() => {
    let min = Number.POSITIVE_INFINITY
    let max = 0

    clinics.forEach((clinic) => {
      clinic.services.forEach((service) => {
        if (service.price) {
          min = Math.min(min, service.price)
          max = Math.max(max, service.price)
        }
      })
    })

    return { min: min === Number.POSITIVE_INFINITY ? 0 : min, max: max === 0 ? 1000 : max }
  }, [clinics])

  useEffect(() => {
    fetchClinics()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [
    clinics,
    searchLocation,
    searchService,
    priceRangeState,
    minRating,
    sortBy,
    selectedServices,
    selectedSpecializations,
  ])

  const fetchClinics = async () => {
    try {
      const response = await fetch("/api/clinics/public")
      if (!response.ok) throw new Error("Failed to fetch clinics")

      const data = await response.json()
      setClinics(data.clinics)
      setFilteredClinics(data.clinics)
    } catch (error) {
      console.error("Error fetching clinics:", error)
      toast.error("Failed to load clinics")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let result = [...clinics]

    // Apply search filters
    if (searchLocation) {
      const locationSearch = searchLocation.toLowerCase()
      result = result.filter(
        (clinic) =>
          clinic.address.toLowerCase().includes(locationSearch) ||
          clinic.city?.toLowerCase().includes(locationSearch) ||
          clinic.state?.toLowerCase().includes(locationSearch),
      )
    }

    if (searchService) {
      const serviceSearch = searchService.toLowerCase()
      result = result.filter((clinic) =>
        clinic.services.some(
          (service) =>
            service.name.toLowerCase().includes(serviceSearch) ||
            service.category.toLowerCase().includes(serviceSearch),
        ),
      )
    }

    // Apply price range filter
    result = result.filter((clinic) =>
      clinic.services.some(
        (service) => !service.price || (service.price >= priceRangeState[0] && service.price <= priceRangeState[1]),
      ),
    )

    // Apply rating filter
    if (minRating !== null) {
      result = result.filter((clinic) => clinic.averageRating >= minRating)
    }

    // Apply service filter
    if (selectedServices.length > 0) {
      result = result.filter((clinic) =>
        selectedServices.some((selectedService) => clinic.services.some((service) => service.name === selectedService)),
      )
    }

    // Apply specialization filter
    if (selectedSpecializations.length > 0) {
      result = result.filter((clinic) =>
        selectedSpecializations.some((selectedSpecialization) =>
          clinic.doctors.some((doctor) => doctor.specialization === selectedSpecialization),
        ),
      )
    }

    // Apply sorting
    switch (sortBy) {
      case "rating-desc":
        result.sort((a, b) => b.averageRating - a.averageRating)
        break
      case "rating-asc":
        result.sort((a, b) => a.averageRating - b.averageRating)
        break
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "reviews-desc":
        result.sort((a, b) => b.totalReviews - a.totalReviews)
        break
      case "appointments-desc":
        result.sort((a, b) => b.totalCompletedAppointments - a.totalCompletedAppointments)
        break
    }

    setFilteredClinics(result)
  }

  const clearFilters = () => {
    setSearchLocation("")
    setSearchService("")
    setPriceRange([initialPriceRange.min, initialPriceRange.max])
    setMinRating(null)
    setSortBy("rating-desc")
    setSelectedServices([])
    setSelectedSpecializations([])
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

  const toggleService = (service: string) => {
    setSelectedServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]))
  }

  const toggleSpecialization = (specialization: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(specialization) ? prev.filter((s) => s !== specialization) : [...prev, specialization],
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

  return (
    <div className="space-y-6">
      <Card className="space-y-4 px-6">
        <h1 className="text-3xl font-bold">Find Dental Clinics</h1>

        {/* Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Location (e.g., Kuala Lumpur)"
                className="pl-10"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Service (e.g., Teeth Cleaning)"
                className="pl-10"
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <Button className="w-full" onClick={() => applyFiltersAndSort()}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {(searchLocation ||
              searchService ||
              minRating !== null ||
              selectedServices.length > 0 ||
              selectedSpecializations.length > 0 ||
              priceRangeState[0] !== initialPriceRange.min ||
              priceRangeState[1] !== initialPriceRange.max) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredClinics.length} {filteredClinics.length === 1 ? "clinic" : "clinics"} found
          </p>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">Price Range</h3>
              <div className="px-2">
                <Slider
                  defaultValue={[initialPriceRange.min, initialPriceRange.max]}
                  min={initialPriceRange.min}
                  max={initialPriceRange.max}
                  step={10}
                  value={[priceRangeState[0], priceRangeState[1]]}
                  onValueChange={(value) => setPriceRange(value)}
                  className="mb-6"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>RM {priceRangeState[0]}</span>
                  <span>RM {priceRangeState[1]}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Minimum Rating</h3>
                <Select
                  value={minRating?.toString() || ""}
                  onValueChange={(value) => setMinRating(value ? Number(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any rating</SelectItem>
                    <SelectItem value="4.5">4.5+ stars</SelectItem>
                    <SelectItem value="4">4+ stars</SelectItem>
                    <SelectItem value="3.5">3.5+ stars</SelectItem>
                    <SelectItem value="3">3+ stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Sort By</h3>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Highest Rated" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating-desc">Highest Rated</SelectItem>
                    <SelectItem value="rating-asc">Lowest Rated</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="reviews-desc">Most Reviewed</SelectItem>
                    <SelectItem value="appointments-desc">Most Appointments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Services</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {uniqueServices.map((service) => (
                  <div key={service} className="flex items-center">
                    <Button
                      variant={selectedServices.includes(service) ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-full justify-start text-sm",
                        selectedServices.includes(service) ? "bg-primary/10 text-primary hover:bg-primary/20" : "",
                      )}
                      onClick={() => toggleService(service)}
                    >
                      {service}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Doctor Specializations</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {uniqueSpecializations.map((specialization) => (
                  <div key={specialization} className="flex items-center">
                    <Button
                      variant={selectedSpecializations.includes(specialization) ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-full justify-start text-sm",
                        selectedSpecializations.includes(specialization)
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "",
                      )}
                      onClick={() => toggleSpecialization(specialization)}
                    >
                      {specialization}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Clinic List */}
      {filteredClinics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Clinics Found</h3>
            <p className="text-muted-foreground text-center">Try adjusting your search filters to find more clinics.</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClinics.map((clinic) => (
            <Card
              onClick={() => redirect(`/patient/clinics/${clinic.id}`)}
              key={clinic.id}
              className="hover:shadow-lg hover:cursor-pointer transition-shadow"
            >
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
                        {service.price && <span className="ml-1">RM{service.price}</span>}
                      </Badge>
                    ))}
                    {clinic.services.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{clinic.services.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectClinic(clinic)
                  }}
                  className="w-full"
                >
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
