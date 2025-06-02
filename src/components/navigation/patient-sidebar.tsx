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
import { Calendar, Home, MapPin, User, Clock, Star } from "lucide-react"
import Link from "next/link"

const patientNavItems = [
  {
    title: "Dashboard",
    url: "/patient/dashboard",
    icon: Home,
  },
  {
    title: "Find Clinics",
    url: "/patient/clinics",
    icon: MapPin,
  },
  {
    title: "My Appointments",
    url: "/patient/appointments",
    icon: Calendar,
  },
  {
    title: "Appointment History",
    url: "/patient/history",
    icon: Clock,
  },
  {
    title: "Reviews",
    url: "/patient/reviews",
    icon: Star,
  },
  {
    title: "Profile",
    url: "/patient/profile",
    icon: User,
  },
]

export function PatientSidebar() {
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
          <SidebarGroupLabel>Patient Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {patientNavItems.map((item) => (
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
