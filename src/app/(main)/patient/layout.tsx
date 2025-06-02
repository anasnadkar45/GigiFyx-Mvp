import type React from "react"
import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks"
import { redirect } from "next/navigation"
import { PatientSidebar } from "@/components/navigation/patient-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

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
      <PatientSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </>
  )
}
