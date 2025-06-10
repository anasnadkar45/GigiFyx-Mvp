'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Calendar, Crown, Globe, Home, Phone, Settings, Menu, X,
  ChevronLeft, ChevronRight, Stethoscope, Users, Clock,
  Calendar1,
  Warehouse,
  StethoscopeIcon,
  Edit
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Logo from '../../../public/GigiFyxLogo.png'
import Image from 'next/image'
import Link from 'next/link'

const sidebarLinks = [
  {
    category: "CLINIC MANAGEMENT",
    links: [
      { id: 0, name: "Dashboard", href: "/clinic/dashboard", icon: Home },
      { id: 1, name: "Appointments", href: "/clinic/appointments", icon: Calendar },
      { id: 2, name: "Patients", href: "/clinic/patients", icon: Users },
      { id: 3, name: "Calendar", href: "/clinic/calendar", icon: Calendar1 },
      { id: 4, name: "Inventory", href: "/clinic/inventory", icon: Warehouse },
      { id: 5, name: "Doctors", href: "/clinic/doctors", icon: StethoscopeIcon },
      { id: 6, name: "Dental Services", href: "/clinic/services", icon: Stethoscope },
    ],
  },
  {
    category: "SETTINGS",
    links: [
      { id: 7, name: "Edit", href: "/clinic/edit", icon: Edit },
    ],
  },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen)

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        onClick={toggleMobile}
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-white/90 backdrop-blur-sm shadow-lg border"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen z-50 bg-sidebar border-r-2 border-sidebar transition-all duration-300 ease-in-out",
        "hidden md:flex flex-col",
        isCollapsed ? "w-16" : "w-60",
        "md:relative md:translate-x-0",
        isMobileOpen ? "flex translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-[91px] px-4 border-b">
          {!isCollapsed && (
            <Link href={'/'} className="flex items-center gap-3">
             <Image src={Logo} alt="GigiFyx Logo" className="size-10"/>
              <h1 className="font-bold text-xl text-sidebar-foreground">GigiFyx</h1>
            </Link>
          )}

          {/* Mobile Close Button */}
          <Button
            onClick={toggleMobile}
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Desktop Collapse Button */}
          <Button
            onClick={toggleCollapse}
            size="icon"
            className="hidden md:flex"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Content */}
        <div className="flex h-full flex-col justify-between p-3">
          <div className="space-y-6 mt-4">
            {sidebarLinks.map((section) => (
              <div key={section.category} className="space-y-2">
                {!isCollapsed && (
                  <h2 className="px-3 text-xs font-semibold uppercase tracking-wider">
                    {section.category}
                  </h2>
                )}
                <nav className="space-y-1">
                  {section.links.map((link) => {
                    const isActive = pathname === link.href
                    return (
                      <a
                        key={link.id}
                        href={link.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                          isCollapsed && "justify-center px-2",
                          isActive
                            ? "bg-secondary border font-bold"
                            : "text-foreground hover:text-foreground hover:bg-secondary hover:shadow-lg hover:scale-[1.02] border border-transparent hover:border"
                        )}
                        title={isCollapsed ? link.name : ''}
                      >
                        <link.icon className={cn(
                          "h-5 w-5 transition-colors",
                          isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
                        )} />
                        {!isCollapsed && (
                          <span className="truncate">{link.name}</span>
                        )}
                      </a>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spacer to shift content beside sidebar */}
      <div className={cn(
        "hidden md:block transition-all duration-300",
        isCollapsed ? "w-0" : "w-0"
      )} />
    </>
  )
}
