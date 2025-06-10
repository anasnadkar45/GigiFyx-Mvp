import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import GoogleLoginForm from "@/components/GoogleLoginForm"

export default async function LoginPage() {
    const session = await auth()

    if (session?.user?.email) {
        try {
            const user = await getUserData()

            if (user.user?.role === "PATIENT") {
                redirect("/patient/dashboard")
            } else if (user.user?.role === "CLINIC_OWNER") {
                redirect("/clinic/dashboard")
            } else if (user.user?.role === "ADMIN") {
                redirect("/admin/dashboard")
            }else if (user.user?.role === "UNASSIGNED"){
                redirect("/onbarding")
            }
        } catch (error) {
            console.error("Error fetching user data:", error)
            redirect("/onboarding")
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">D</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">DentalCare</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Sign in to your account to continue</p>
                </div>

                {/* Login Form */}
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>Choose your preferred sign-in method</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <GoogleLoginForm />
                    </CardContent>
                </Card>

                {/* Features */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 mb-4">Join thousands of satisfied patients</p>
                    <div className="flex justify-center space-x-6 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Verified Clinics</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Easy Booking</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Secure Platform</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>
                        By signing in, you agree to our{" "}
                        <Link href="/terms" className="hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
