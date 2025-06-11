"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Users,
  Star,
  CheckCircle,
  Brain,
  BarChart3,
  Package,
  MessageSquare,
} from "lucide-react"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Image from "next/image"
import Logo from "../../../public/GigiFyxLogo.png"

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
    if (!user?.id) {
      toast.error("Please sign in to book an appointment", {
        description: "You need to be registered to book appointments",
        action: {
          label: "Sign In",
          onClick: () => router.push("/login"),
        },
      })
    } else if (selectedClinic) {
      router.push(`/patient/clinics/${selectedClinic.id}/book`)
    }
    setIsBookingDialogOpen(false)
  }

  const handleSearch = () => {
    if (!user?.id) {
      toast.error("Please sign in to book an appointment", {
        description: "You need to be registered to book appointments",
        action: {
          label: "Sign In",
          onClick: () => router.push("/login"),
        },
      })
    } else {
      const params = new URLSearchParams()
      if (searchLocation) params.set("location", searchLocation)
      if (searchService) params.set("service", searchService)
      router.push(`/patient/clinics?${params.toString()}`)
    }
  }

  // Get minimum price for each clinic
  const getMinPrice = (services: any[]) => {
    const prices = services.filter((s) => s.price).map((s) => s.price)
    return prices.length > 0 ? Math.min(...prices) : null
  }

  const commonServices = [
    { name: "Dental Scaling", icon: "🦷", description: "Professional teeth cleaning" },
    { name: "Tooth Filling", icon: "🔧", description: "Cavity treatment and restoration" },
    { name: "Root Canal", icon: "🩺", description: "Advanced endodontic treatment" },
    { name: "Teeth Whitening", icon: "✨", description: "Professional whitening service" },
    { name: "Dental Implants", icon: "🔩", description: "Permanent tooth replacement" },
    { name: "Orthodontics", icon: "📐", description: "Braces and alignment treatment" },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      location: "Kuala Lumpur",
      rating: 5,
      comment:
        "GigiFyx made it so easy to find a great dentist near me. The AI symptom checker helped me understand my issue before booking!",
    },
    {
      name: "Ahmad Rahman",
      location: "Petaling Jaya",
      rating: 5,
      comment:
        "As a clinic owner, GigiFyx has transformed how we manage appointments and inventory. The analytics are incredibly helpful.",
    },
    {
      name: "Lisa Wong",
      location: "Shah Alam",
      rating: 5,
      comment: "The booking process is seamless, and I love getting reminders for my appointments. Highly recommend!",
    },
  ]

  const faqs = [
    {
      question: "How do I book an appointment?",
      answer:
        "Simply search for clinics in your area, select a service, choose your preferred time slot, and confirm your booking. You'll receive instant confirmation and reminders.",
    },
    {
      question: "Is the AI symptom checker accurate?",
      answer:
        "Our AI symptom checker provides preliminary guidance based on your symptoms, but it's not a substitute for professional medical advice. Always consult with a qualified dentist for proper diagnosis.",
    },
    {
      question: "How are clinics verified?",
      answer:
        "All clinics on our platform undergo a thorough verification process including license validation, facility inspection, and ongoing quality monitoring.",
    },
    {
      question: "Can I cancel or reschedule my appointment?",
      answer:
        "Yes, you can cancel or reschedule appointments through your dashboard, subject to the clinic's cancellation policy.",
    },
    {
      question: "How do I become a clinic partner?",
      answer:
        "Clinic owners can apply through our 'For Clinics' section. We'll guide you through the verification process and help you set up your profile.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-25 to-pink-50">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-purple-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Image src={Logo || "/placeholder.svg"} alt="GigiFyx Logo" height={50} />
            <span className="text-2xl font-bold text-gray-800">GigiFyx</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#services" className="text-gray-700 hover:text-purple-600 font-medium">
              Services
            </Link>
            <Link href="#how-it-works" className="text-gray-700 hover:text-purple-600 font-medium">
              How It Works
            </Link>
            <Link href="#for-clinics" className="text-gray-700 hover:text-purple-600 font-medium">
              For Clinics
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-purple-600 font-medium">
              About
            </Link>
          </nav>

          {/* Auth Buttons */}
          {!user?.id ? (
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button>Sign In</Button>
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
              {user.role === "UNASSIGNED" && (
                <Link href="/onboarding">
                  <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    Onboarding
                  </Button>
                </Link>
              )}
              <Button onClick={() => signOut()} variant="destructive">
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Your Smile, Our{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                AI-Powered
              </span>{" "}
              Priority
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Malaysia's most advanced dental booking platform with AI symptom checking, smart recommendations, and
              comprehensive clinic management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg">
                Book Appointment
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 text-lg"
              >
                Try AI Symptom Checker
              </Button>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-purple-200 text-sm">Verified Clinics</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">10K+</div>
                <div className="text-purple-200 text-sm">Happy Patients</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">50K+</div>
                <div className="text-purple-200 text-sm">Appointments</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">4.9★</div>
                <div className="text-purple-200 text-sm">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 px-4 -mt-8 relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Find Your Perfect Dental Care</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Location Input */}
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Enter location (e.g., KL Sentral)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-12 h-14 text-lg border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>

              {/* Service Input */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🦷</div>
                <Input
                  placeholder="Service needed (e.g., Scaling)"
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
                Search Clinics
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How GigiFyx Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple, smart, and secure - book your dental appointment in just a few clicks
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Search & Discover</h3>
              <p className="text-gray-600">Find verified dental clinics near you with our smart search</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. AI Symptom Check</h3>
              <p className="text-gray-600">Get preliminary guidance with our AI-powered symptom checker</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Book Instantly</h3>
              <p className="text-gray-600">Choose your preferred time slot and book instantly</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">4. Get Treatment</h3>
              <p className="text-gray-600">Receive quality dental care and track your treatment history</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Dental Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From routine cleanings to advanced treatments, find the right care for your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {commonServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clinics */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Dental Clinics</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover top-rated dental clinics in your area</p>
          </div>

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

                    {/* Rating */}
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">
                        {clinic.avgRating} ({clinic.totalRatings} reviews)
                      </span>
                    </div>

                    {/* Services */}
                    <p className="text-gray-600 text-sm mb-3">{servicesList || "General Dental Services"}</p>

                    {/* Location */}
                    <p className="text-gray-500 text-sm mb-4">{clinic.city || clinic.address}</p>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {minPrice ? `RM ${minPrice}` : "RM 150"}
                      </div>
                      <div className="text-gray-500 text-sm">Starting from</div>
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

      {/* AI Features Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Dental Care</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the future of dental care with our advanced AI features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Smart Symptom Checker</CardTitle>
                <CardDescription className="text-gray-600">
                  Get instant preliminary assessment of your dental symptoms with AI guidance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Personalized Recommendations</CardTitle>
                <CardDescription className="text-gray-600">
                  Receive tailored clinic and treatment recommendations based on your needs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg bg-white">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">AI Treatment Planning</CardTitle>
                <CardDescription className="text-gray-600">
                  Advanced AI assists dentists in creating comprehensive treatment plans
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* For Clinics Section */}
      <section id="for-clinics" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">For Dental Clinics</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive practice management tools to grow your dental clinic
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Smart Scheduling</CardTitle>
                <CardDescription className="text-gray-600">
                  Automated appointment management with real-time availability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-lg">Inventory Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Track supplies, equipment, and medications with smart alerts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                <CardDescription className="text-gray-600">
                  Comprehensive insights into your practice performance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Patient Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Complete patient records and treatment history tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg">
              Join as Clinic Partner
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Real experiences from patients and clinic owners across Malaysia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.comment}"</p>
                  <div>
                    <div className="font-semibold text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about GigiFyx</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Dental Care Experience?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Join thousands of satisfied patients and clinic partners on GigiFyx
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg">
              Book Your First Appointment
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 text-lg"
            >
              Partner With Us
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3">
                <Image src={Logo || "/placeholder.svg"} alt="GigiFyx Logo" height={50} />
                <span className="text-2xl font-bold text-gray-800">GigiFyx</span>
              </div>
              <p className="text-gray-400 mb-4">
                Malaysia's leading AI-powered dental booking platform, making quality dental care accessible and
                convenient for everyone.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm">📧</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm">📱</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm">🐦</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Patients</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Find Clinics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    AI Symptom Checker
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    My Appointments
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Treatment History
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Clinics</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Join Platform
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Practice Management
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Inventory System
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2024 GigiFyx. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">🇲🇾 Made in Malaysia</span>
              <span className="text-gray-400 text-sm">•</span>
              <span className="text-gray-400 text-sm">🔒 SSL Secured</span>
            </div>
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
