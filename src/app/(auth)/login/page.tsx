import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks"
import { redirect } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GoogleLoginForm from "@/components/GoogleLoginForm"
import Image from "next/image"
import Logo from '../../../../public/GigiFyxLogo.png'

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
            } else if (user.user?.role === "UNASSIGNED") {
                redirect("/onboarding")
            }
        } catch (error) {
            console.error("Error fetching user data:", error)
            redirect("/onboarding")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-white p-6 animate-fade-in">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Image src={Logo} alt="Logo" height={80} />
                        <span className="text-3xl font-bold text-primary">GigiFyx</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-lg">
                    <CardHeader className="text-center space-y-1">
                        <CardTitle className="text-2xl">Sign In</CardTitle>
                        <CardDescription>Choose your preferred sign-in method</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <GoogleLoginForm />
                    </CardContent>
                </Card>

                {/* Features */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 mb-4">Join thousands of satisfied patients</p>
                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                        <FeatureDot color="green" label="Verified Clinics" />
                        <FeatureDot color="blue" label="Easy Booking" />
                        <FeatureDot color="purple" label="Secure Platform" />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>
                        By signing in, you agree to our{" "}
                        <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> and{" "}
                        <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

function FeatureDot({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full bg-${color}-500`} />
            <span>{label}</span>
        </div>
    )
}
