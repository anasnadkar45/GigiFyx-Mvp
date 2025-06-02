import type React from "react"
import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks"
import { redirect } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AdminSidebar } from "@/components/navigation/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = await getUserData()

  if (!session?.user?.email) {
    redirect("/login")
  }

  if (user.user?.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <>
      <AdminSidebar />
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
