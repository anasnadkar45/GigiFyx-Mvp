
import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks";
import OnBoardingForm from "@/components/onboarding/OnBoardingForm";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await auth();
  const user = await getUserData()

  if (!session?.user?.email) {
    redirect("/");
  }

  if(user.user?.role === "CLINIC_OWNER"){
    redirect("/clinic/dashboard");
  }else if(user.user?.role === "PATIENT"){
    redirect("/patient/dashboard");
  }else if(user.user?.role === "ADMIN"){
    redirect("/admin/dashboard");
  }

  return (
    <>
      <OnBoardingForm />
    </>
  )
}
