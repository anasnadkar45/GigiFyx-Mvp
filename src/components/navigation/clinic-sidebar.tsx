import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Calendar, Home, Settings, Users, Stethoscope, Clock, BarChart3 } from "lucide-react"
import Link from "next/link"

const clinicNavItems = [
  {
    title: "Dashboard",
    url: "/clinic/dashboard",
    icon: Home,
  },
  {
    title: "Appointments",
    url: "/clinic/appointments",
    icon: Calendar,
  },
  {
    title: "Services",
    url: "/clinic/services",
    icon: Stethoscope,
  },
  {
    title: "Calendar",
    url: "/clinic/calendar",
    icon: Clock,
  },
  {
    title: "Patients",
    url: "/clinic/patients",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/clinic/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/clinic/settings",
    icon: Settings,
  },
]

export function ClinicSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-4 py-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <span className="text-xl font-bold text-primary">DentalCare</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clinic Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clinicNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
