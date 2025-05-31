"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import {
  Calendar,
  Home,
  Search,
  User,
  Settings,
  Building2,
  Users,
  BarChart3,
  FileText,
  HelpCircle,
  Phone,
  LogOut,
  ChevronUp,
  Plus,
  Clock,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"

// Menu items for different user types
const patientMenuItems = [
  {
    title: "Dashboard",
    url: "/patient/dashboard",
    icon: Home,
  },
  {
    title: "Find Clinics",
    url: "/patient/search",
    icon: Search,
  },
  {
    title: "My Appointments",
    url: "/patient/appointments",
    icon: Calendar,
  },
  {
    title: "Profile",
    url: "/patient/profile",
    icon: User,
    items: [
      {
        title: "Personal Info",
        url: "/patient/profile?tab=personal",
      },
      {
        title: "Notifications",
        url: "/patient/profile?tab=notifications",
      },
      {
        title: "Security",
        url: "/patient/profile?tab=security",
      },
      {
        title: "Billing",
        url: "/patient/profile?tab=billing",
      },
    ],
  },
]

const clinicMenuItems = [
  {
    title: "Dashboard",
    url: "/clinic/dashboard",
    icon: Home,
  },
  {
    title: "Calendar",
    url: "/clinic/calendar",
    icon: Calendar,
  },
  {
    title: "Appointments",
    url: "/clinic/appointments",
    icon: Clock,
  },
  {
    title: "Patients",
    url: "/clinic/patients",
    icon: Users,
  },
  {
    title: "Profile",
    url: "/clinic/profile",
    icon: Building2,
    items: [
      {
        title: "Clinic Info",
        url: "/clinic/profile?tab=info",
      },
      {
        title: "Services",
        url: "/clinic/profile?tab=services",
      },
      {
        title: "Team",
        url: "/clinic/profile?tab=team",
      },
    ],
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

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Clinic Applications",
    url: "/admin/applications",
    icon: FileText,
  },
  {
    title: "Clinics",
    url: "/admin/clinics",
    icon: Building2,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

const generalMenuItems = [
  {
    title: "About",
    url: "/about",
    icon: HelpCircle,
  },
  {
    title: "Contact",
    url: "/contact",
    icon: Phone,
  },
  {
    title: "Help Center",
    url: "/help",
    icon: HelpCircle,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Determine user type based on pathname
  const getUserType = () => {
    if (pathname?.startsWith("/patient")) return "patient"
    if (pathname?.startsWith("/clinic")) return "clinic"
    if (pathname?.startsWith("/admin")) return "admin"
    return "guest"
  }

  const userType = getUserType()

  // Get appropriate menu items
  const getMenuItems = () => {
    switch (userType) {
      case "patient":
        return patientMenuItems
      case "clinic":
        return clinicMenuItems
      case "admin":
        return adminMenuItems
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  // Get user info based on type
  const getUserInfo = () => {
    switch (userType) {
      case "patient":
        return {
          name: "John Doe",
          email: "john@example.com",
          avatar: "JD",
        }
      case "clinic":
        return {
          name: "Smile Dental Clinic",
          email: "clinic@smiledental.com",
          avatar: "SD",
        }
      case "admin":
        return {
          name: "Admin User",
          email: "admin@gigifyx.com",
          avatar: "AD",
        }
      default:
        return null
    }
  }

  const userInfo = getUserInfo()

  if (userType === "guest") {
    return null // Don't show sidebar for guest users
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-lg">🦷</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">GigiFyx</span>
                  <span className="truncate text-xs capitalize">{userType} Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild defaultOpen={pathname?.startsWith(item.url)}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton tooltip={item.title} asChild>
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userType === "clinic" && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/clinic/calendar">
                      <Plus />
                      <span>Add Time Slot</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/clinic/profile?tab=services">
                      <Plus />
                      <span>Add Service</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {userType === "patient" && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/search">
                      <Plus />
                      <span>Book Appointment</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/search?emergency=true">
                      <Clock />
                      <span>Emergency Booking</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/placeholder.svg" alt={userInfo?.name} />
                    <AvatarFallback className="rounded-lg">{userInfo?.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userInfo?.name}</span>
                    <span className="truncate text-xs">{userInfo?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href={`/${userType}/profile`}>
                    <User />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${userType}/settings`}>
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help">
                    <HelpCircle />
                    Help
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <LogOut />
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
