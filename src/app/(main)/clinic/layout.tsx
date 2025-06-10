import type React from "react"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/app/utils/db"
import { Sidebar } from "@/components/navigation/Sidebar-Clinic"
import { ScrollArea } from "@/components/ui/scroll-area"
import VerificationGate from "@/components/clinic/VerificationGate"

export default async function ClinicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      clinic: true,
    },
  })

  if (!user || user.role !== "CLINIC_OWNER") {
    redirect("/")
  }

  // If user doesn't have a clinic, redirect to registration
  if (!user.clinic) {
    redirect("/clinic/verification")
  }

  // If clinic is not approved, show verification gate
  if (user.clinic.status !== "APPROVED") {
    return (
      <VerificationGate
        clinic={user.clinic as any}
        user={{
          id: user.id,
          name: user.name || "",
          email: user.email,
          role: user.role,
        }}
      />
    )
  }

  // If clinic is approved, show full dashboard
  return (
    <>
      <div className="w-screen h-screen flex custom-scrollbar scroll-smooth">
        <div className="md:m-3 flex flex-col">
          <Sidebar />
        </div>
        <div className="w-full">
          <ScrollArea className="h-[100vh] md:h-[100vh] border-l-2">{children}</ScrollArea>
        </div>
      </div>
    </>
  )
}
