import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Shield, Star } from "lucide-react"
import Link from "next/link"
import GoogleLoginForm from "@/components/GoogleLoginForm"
import { SignupForm } from "@/components/onboarding/SignupForm"

export default async function SignUpPage() {
  const session = await auth()

  if (session?.user?.email) {
    try {
      const user = await getUserData()

      if (user?.user?.role === "CLINIC_OWNER" || user?.user?.role === "PATIENT") {
        if (user?.user?.role === "PATIENT") {
          redirect("/patient/dashboard")
        } else if (user?.user?.role === "CLINIC_OWNER") {
          redirect("clinic/dashboard")
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      redirect("/onboarding")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-primary">DentalCare</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                Already have an account? Sign in
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Benefits */}
          <div className="space-y-8">
            <div>
              <Badge className="mb-4" variant="secondary">
                Join 10,000+ Happy Patients
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Start Your Journey to Better <span className="text-primary">Dental Health</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Connect with verified dental clinics, book appointments instantly, and take control of your oral health.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Easy Appointment Booking</h3>
                  <p className="text-gray-600">
                    Book appointments in seconds with real-time availability from verified dental clinics.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Find Nearby Clinics</h3>
                  <p className="text-gray-600">
                    Discover top-rated dental clinics in your area with detailed profiles and patient reviews.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Verified & Trusted</h3>
                  <p className="text-gray-600">
                    All clinics are thoroughly verified and reviewed to ensure quality care and safety.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Patient Reviews</h3>
                  <p className="text-gray-600">
                    Read authentic reviews from real patients to make informed decisions about your care.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-gray-600">Verified Clinics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-gray-600">Happy Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4.9</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <Card className="shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Create Your Account</CardTitle>
                  <CardDescription>
                    Join DentalCare and start booking appointments with top dental clinics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SignupForm />

                  <div className="text-center text-sm text-muted-foreground">
                    <p>
                      Already have an account?{" "}
                      <Link href="/login" className="text-primary hover:underline font-medium">
                        Sign in here
                      </Link>
                    </p>
                  </div>

                  <div className="text-center text-xs text-gray-500 pt-4 border-t">
                    <p>
                      By creating an account, you agree to our{" "}
                      <Link href="/terms" className="hover:underline text-primary">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="hover:underline text-primary">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">Trusted by patients nationwide</p>
                <div className="flex justify-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>100% Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>HIPAA Compliant</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
