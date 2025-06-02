import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"

export default async function HomePage() {
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
      } else {
        redirect("/onboarding")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      // If there's an error, continue to landing page
    }
  }

  return <LandingPage />
}
