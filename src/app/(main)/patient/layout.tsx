import type React from "react"
import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/navigation/Sidebar-Patient"
import { ScrollArea } from "@/components/ui/scroll-area"

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = await getUserData()

  if (!session?.user?.email) {
    redirect("/login")
  }

  if (user.user?.role !== "PATIENT") {
    redirect("/onboarding")
  }

  return (
    <>
      <div className="w-screen h-screen flex custom-scrollbar scroll-smooth">
        <div className="md:m-3 flex flex-col">
          <Sidebar />
        </div>
        <div className="w-full">
          <ScrollArea className="h-[100vh] md:h-[100vh]  border-l-2">
            {children}
          </ScrollArea>
        </div>
        {/* <BottomNav /> */}
      </div>
    </>
  )
}
