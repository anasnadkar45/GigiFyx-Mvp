"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import { User, Settings, LogOut, Calendar, CreditCard } from "lucide-react"

export function UserNav() {
  const router = useRouter()
  const pathname = usePathname()
  const isClinic = pathname?.startsWith("/clinic")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="Avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{isClinic ? "Smile Dental Clinic" : "John Doe"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {isClinic ? "clinic@smiledental.com" : "john@example.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(isClinic ? "/clinic/profile" : "/patient/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(isClinic ? "/clinic/dashboard" : "/patient/dashboard")}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>{isClinic ? "Dashboard" : "My Bookings"}</span>
          </DropdownMenuItem>
          {!isClinic && (
            <DropdownMenuItem onClick={() => router.push("/patient/billing")}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => router.push(isClinic ? "/clinic/settings" : "/patient/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/")}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
