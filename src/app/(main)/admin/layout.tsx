import type React from "react"
import { auth } from "@/app/utils/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/app/utils/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Building2, Users, BarChart3, Settings } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar relative shadow-sm border-r">
        <div className="p-6">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">DentalCare Platform</p>
        </div>

        <nav className="px-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/clinics">
            <Button variant="ghost" className="w-full justify-start">
              <Building2 className="h-4 w-4 mr-2" />
              Clinics
            </Button>
          </Link>
          <Link href="/admin/patients">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Patients
            </Button>
          </Link>
          {/* <Link href="/admin/analytics">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link> */}
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 bg-white rounded-lg">
            <p className="text-sm font-medium">{user.name || user.email}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <ScrollArea className="h-[100vh] md:h-[100vh]  border-l-2">
          {children}
        </ScrollArea>
      </div>
    </div>
  )
}
