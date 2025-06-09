"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Shield, Clock, ChevronRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Toaster } from "sonner"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Clinic = {
  id: string
  name: string
  address: string
  city: string | null
  state: string | null
  image: string | null
  description: string
  services: {
    id: string
    name: string
    price: number | null
    category: string
  }[]
  avgRating: string
  totalRatings: number
}

export function LandingPage({ user, featuredClinics = [] }: { user: any; featuredClinics: Clinic[] }) {
  const router = useRouter()
  const [searchLocation, setSearchLocation] = useState("")
  const [searchService, setSearchService] = useState("")
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)

  const handleBookNow = (clinic: Clinic) => {
    if (!user?.id) {
      toast.error("Please sign in to book an appointment", {
        description: "You need to be registered to book appointments",
        action: {
          label: "Sign In",
          onClick: () => router.push("/login"),
        },
      })
      return
    }

    if (user.role !== "PATIENT") {
      toast.error("Patient account required", {
        description: "You need a patient account to book appointments",
        action: {
          label: "Complete Onboarding",
          onClick: () => router.push("/onboarding"),
        },
      })
      return
    }

    setSelectedClinic(clinic)
    setIsBookingDialogOpen(true)
  }

  const handleProceedToBooking = () => {
    if (selectedClinic) {
      router.push(`/patient/clinics/${selectedClinic.id}/book`)
    }
    setIsBookingDialogOpen(false)
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchLocation) params.set("location", searchLocation)
    if (searchService) params.set("service", searchService)
    router.push(`/patient/clinics?${params.toString()}`)
  }

  // Get minimum price for each clinic
  const getMinPrice = (services: any[]) => {
    const prices = services.filter((s) => s.price).map((s) => s.price)
    return prices.length > 0 ? Math.min(...prices) : null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-25 to-pink-50">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-purple-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center relative">
                <span className="text-white font-bold text-lg">🦷</span>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-400" />
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">😊</span>
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-800">GigiFyx</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/find-dentist" className="text-gray-700 hover:text-purple-600 font-medium">
              Find a Dentist
            </Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-purple-600 font-medium">
              How It Works
            </Link>
            <Link href="/for-clinics" className="text-gray-700 hover:text-purple-600 font-medium">
              For Clinics
            </Link>
          </nav>

          {/* Auth Buttons */}
          {!user?.id ? (
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full">Sign Up</Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {user.role === "PATIENT" && (
                <Link href="/patient/dashboard">
                  <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    Dashboard
                  </Button>
                </Link>
              )}
              {user.role === "CLINIC_OWNER" && (
                <Link href="/clinic/dashboard">
                  <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    Dashboard
                  </Button>
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    Dashboard
                  </Button>
                </Link>
              )}
              <Button onClick={() => signOut()} variant="ghost" className="text-gray-600 hover:text-red-600">
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Location Input */}
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="KL Sentral"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-12 h-14 text-lg border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>

              {/* Service Input */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🦷</div>
                <Input
                  placeholder="Scaling"
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  className="pl-12 h-14 text-lg border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="text-center">
              <Button
                onClick={handleSearch}
                className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 text-lg rounded-full font-semibold"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Featured Clinics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredClinics.map((clinic) => {
              const minPrice = getMinPrice(clinic.services)
              const servicesList = clinic.services
                .slice(0, 3)
                .map((s) => s.name)
                .join(", ")

              return (
                <Card
                  key={clinic.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border-0 overflow-hidden"
                >
                  {/* Profile Image */}
                  <div className="flex justify-center pt-6 pb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center overflow-hidden">
                      {clinic.image ? (
                        <img
                          src={clinic.image || "/placeholder.svg"}
                          alt={clinic.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl">👨‍⚕️</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <CardContent className="text-center px-6 pb-6">
                    {/* Clinic Name */}
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{clinic.name}</h3>

                    {/* Services */}
                    <p className="text-gray-600 text-sm mb-3">{servicesList || "General Dental Services"}</p>

                    {/* Location */}
                    <p className="text-gray-500 text-sm mb-4">{clinic.city || clinic.address}</p>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {minPrice ? `RM ${minPrice}` : "RM 150"}
                      </div>
                      <div className="text-gray-500 text-sm">Start at</div>
                    </div>

                    {/* Book Button */}
                    <Button
                      onClick={() => handleBookNow(clinic)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full py-2"
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* View All Button */}
          {featuredClinics.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/patient/clinics">
                <Button
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 px-8 py-3 rounded-full"
                >
                  View All Clinics
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {/* Empty State */}
          {featuredClinics.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🦷</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No clinics available</h3>
              <p className="text-gray-600">Please check back later or contact support.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose GigiFyx?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make dental care accessible, convenient, and reliable for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Easy Booking</CardTitle>
                <CardDescription className="text-gray-600">
                  Book appointments in seconds with real-time availability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Find Nearby Clinics</CardTitle>
                <CardDescription className="text-gray-600">
                  Discover verified dental clinics in your area
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Verified Providers</CardTitle>
                <CardDescription className="text-gray-600">
                  All clinics are verified and reviewed by our team
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-purple-100">Dental Clinics</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-purple-100">Happy Patients</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-purple-100">Appointments</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="text-purple-100">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">G</span>
                </div>
                <span className="text-xl font-bold">GigiFyx</span>
              </div>
              <p className="text-gray-400">Making dental care accessible and convenient for everyone.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Patients</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/patient/clinics">Find Clinics</Link>
                </li>
                <li>
                  <Link href="/patient/appointments">My Appointments</Link>
                </li>
                <li>
                  <Link href="/patient/profile">Profile</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Clinics</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/clinic/register">Join Platform</Link>
                </li>
                <li>
                  <Link href="/clinic/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link href="/clinic/services">Manage Services</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help">Help Center</Link>
                </li>
                <li>
                  <Link href="/contact">Contact Us</Link>
                </li>
                <li>
                  <Link href="/privacy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GigiFyx. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book an Appointment</DialogTitle>
            <DialogDescription>You're about to book an appointment with {selectedClinic?.name}</DialogDescription>
          </DialogHeader>

          {selectedClinic && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  {selectedClinic.image ? (
                    <img
                      src={selectedClinic.image || "/placeholder.svg"}
                      alt={selectedClinic.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-2xl">👨‍⚕️</span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{selectedClinic.name}</h3>
                  <p className="text-sm text-gray-500">
                    {[selectedClinic.address, selectedClinic.city, selectedClinic.state].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-purple-600" />
                  Available Services
                </h4>
                <ul className="space-y-2">
                  {selectedClinic.services.length > 0 ? (
                    selectedClinic.services.map((service) => (
                      <li key={service.id} className="text-sm flex justify-between">
                        <span>{service.name}</span>
                        {service.price && <span className="font-medium">RM{service.price}</span>}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">No services listed</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProceedToBooking} className="bg-purple-600 hover:bg-purple-700">
              Proceed to Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
