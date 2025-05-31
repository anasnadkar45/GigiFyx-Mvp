"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { UserNav } from "./user-nav"

export function MainNav() {
  const pathname = usePathname()

  const isAuthPage = pathname?.startsWith("/auth")
  const isDashboardPage =
    pathname?.startsWith("/patient") || pathname?.startsWith("/clinic") || pathname?.startsWith("/admin")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {isDashboardPage && <SidebarTrigger />}

        <h1>Logo</h1>

        {!isAuthPage && !isDashboardPage && (
          <nav className="flex items-center space-x-6 text-sm font-medium ml-6">
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Home
            </Link>
            <Link
              href="/search"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/search" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Find Clinics
            </Link>
            <Link
              href="/about"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/about" ? "text-primary" : "text-muted-foreground",
              )}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/contact" ? "text-primary" : "text-muted-foreground",
              )}
            >
              Contact
            </Link>
          </nav>
        )}

        <div className="ml-auto flex items-center space-x-4">
          {!isAuthPage && !isDashboardPage && (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/onboarding">Get Started</Link>
              </Button>
            </>
          )}

          {isDashboardPage && <UserNav />}

          {/* <ModeToggle /> */}
        </div>
      </div>
    </header>
  )
}
