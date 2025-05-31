
import { auth } from "@/app/utils/auth"
import OnBoardingForm from "@/components/onboarding/OnBoardingForm";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <>
      <OnBoardingForm />
    </>
  )
}
