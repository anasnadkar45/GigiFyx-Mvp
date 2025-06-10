import type React from "react"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/app/utils/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Building2, Users, BarChart3, Settings } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar } from "@/components/navigation/admin-sidebar"

export default async function AdminLayout({
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
  })

  if (!user || user.role !== "ADMIN") {
    redirect("/")
  }

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
