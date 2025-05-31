
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { SignupForm } from "@/components/onboarding/SignupForm"
import { redirect } from "next/navigation"

export default async function SignUp() {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: {
      id: session?.user?.id
    }
  })

  if(user?.role === "CLINIC_OWNER" || user?.role === "PATIENT"){
    if(user?.role === "PATIENT"){
      redirect("/patient/dashboard")
    }else if(user?.role === "CLINIC_OWNER"){
      redirect("clinic/dashboard")
    }
  }
  return (
    <SignupForm />
  )
}

