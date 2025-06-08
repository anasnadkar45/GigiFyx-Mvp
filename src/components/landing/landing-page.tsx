"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Shield, Star, Clock, ChevronRight, Search } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Toaster } from "sonner"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
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

    // If user is logged in and is a patient, show booking dialog
    setSelectedClinic(clinic)
    setIsBookingDialogOpen(true)
  }

  const handleProceedToBooking = () => {
    if (selectedClinic) {
      router.push(`/patient/clinics/${selectedClinic.id}`)
    }
    setIsBookingDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Sonner Toaster */}
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-primary">DentalCare</span>
          </div>
          {!user?.id ? (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          ) : user?.role === "CLINIC_OWNER" ? (
            <div className="flex items-center space-x-4">
              <Link href="/clinic/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <form
                action={() => {
                  signOut()
                }}
              >
                <Button type="submit" className="w-full" variant={"destructive"}>
                  Logout
                </Button>
              </form>
            </div>
          ) : user?.role === "PATIENT" ? (
            <div className="flex items-center space-x-4">
              <Link href="/patient/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <form
                action={() => {
                  signOut()
                }}
              >
                <Button type="submit" className="w-full" variant={"destructive"}>
                  Logout
                </Button>
              </form>
            </div>
          ) : user?.role === "ADMIN" ? (
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <form
                action={() => {
                  signOut()
                }}
              >
                <Button type="submit" className="w-full" variant={"destructive"}>
                  Logout
                </Button>
              </form>
            </div>
          ) : (
            user?.role === "UNASSIGNED" && (
              <div className="flex items-center space-x-4">
                <Link href="/onboarding">
                  <Button variant="outline">Complete Onboarding</Button>
                </Link>
              </div>
            )
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            Trusted by 500+ Dental Clinics
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Smile, Our <span className="text-primary">Priority</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with top-rated dental clinics, book appointments instantly, and manage your oral health with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/patient/clinics">
              <Button size="lg" className="w-full sm:w-auto">
                <Calendar className="mr-2 h-5 w-5" />
                Book Appointment
              </Button>
            </Link>
            <Link href="/clinic/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Users className="mr-2 h-5 w-5" />
                Join as Clinic
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Clinic Search Section */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Dental Clinic</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our network of verified dental clinics and book your appointment today
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search clinics by name or service..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="kuala-lumpur">Kuala Lumpur</SelectItem>
                    <SelectItem value="penang">Penang</SelectItem>
                    <SelectItem value="johor">Johor</SelectItem>
                    <SelectItem value="selangor">Selangor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Featured Clinics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredClinics.map((clinic) => (
              <Card key={clinic.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 bg-gray-200 relative">
                  {clinic.image ? (
                    <img
                      src={clinic.image || "/placeholder.svg"}
                      alt={clinic.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-primary font-semibold">No Image Available</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{clinic.avgRating}</span>
                    <span className="text-xs text-gray-500 ml-1">({clinic.totalRatings})</span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{clinic.name}</span>
                  </CardTitle>
                  <CardDescription className="flex items-start mt-2">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{[clinic.address, clinic.city, clinic.state].filter(Boolean).join(", ")}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{clinic.description}</p>

                    {clinic.services.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Popular Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {clinic.services.map((service) => (
                            <Badge key={service.id} variant="outline" className="bg-primary/5">
                              {service.name}
                              {service.price && ` - RM${service.price}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  {user?.id && (
                    <Button variant="outline" size="sm" onClick={() => router.push(`/patient/clinics/${clinic.id}`)}>
                      View Details
                    </Button>
                  )}
                  <Button size="sm" onClick={() => handleBookNow(clinic)}>
                    Book Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {featuredClinics.length > 0 && (
            <div className="text-center mt-10">
              <Link href="/patient/clinics">
                <Button variant="outline" className="group">
                  View All Clinics
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          )}

          {featuredClinics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No clinics available at the moment.</p>
              <p className="text-sm text-gray-400">Please check back later or contact support.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DentalCare?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make dental care accessible, convenient, and reliable for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Easy Booking</CardTitle>
                <CardDescription>Book appointments in seconds with real-time availability</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Find Nearby Clinics</CardTitle>
                <CardDescription>Discover verified dental clinics in your area</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Verified Providers</CardTitle>
                <CardDescription>All clinics are verified and reviewed by our team</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-foreground/80">Dental Clinics</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-primary-foreground/80">Happy Patients</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-primary-foreground/80">Appointments</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="text-primary-foreground/80">Average Rating</div>
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
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">D</span>
                </div>
                <span className="text-xl font-bold">DentalCare</span>
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
            <p>&copy; 2024 DentalCare Marketplace. All rights reserved.</p>
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
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  {selectedClinic.image ? (
                    <img
                      src={selectedClinic.image || "/placeholder.svg"}
                      alt={selectedClinic.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <MapPin className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{selectedClinic.name}</h3>
                  <p className="text-sm text-gray-500">
                    {[selectedClinic.address, selectedClinic.city, selectedClinic.state].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
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
                {selectedClinic.services.length > 3 && (
                  <p className="text-xs text-gray-500 mt-2">And more services available...</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProceedToBooking}>Proceed to Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
