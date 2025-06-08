import { cn } from "@/lib/utils"
import type React from "react"

interface TopbarProps {
  children: React.ReactNode
  className?: string
}

interface TopbarTitleProps {
  children: React.ReactNode
  className?: string
}

interface TopbarDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface TopbarActionProps {
  children: React.ReactNode
  className?: string
}

export const Topbar = ({ children, className }: TopbarProps) => {
  return (
    <div
      className={cn("flex items-center justify-between gap-6 w-full min-h-20 border-b bg-card px-4 py-4", className)}
    >
      {children}
    </div>
  )
}

export const TopbarTitle = ({ children, className }: TopbarTitleProps) => {
  return <h1 className={cn("text-2xl md:text-3xl font-bold text-foreground", className)}>{children}</h1>
}

export const TopbarDescription = ({ children, className }: TopbarDescriptionProps) => {
  return <p className={cn("text-sm md:text-base text-muted-foreground hidden sm:block", className)}>{children}</p>
}

export const TopbarAction = ({ children, className }: TopbarActionProps) => {
  return <div className={cn("flex items-center gap-2 flex-shrink-0", className)}>{children}</div>
}

// Compound component for easier usage
export const TopbarContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("flex flex-col gap-1 flex-1 min-w-0", className)}>{children}</div>
}

// Alternative: All-in-one component for common use cases
interface TopbarSimpleProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const TopbarSimple = ({ title, description, action, className }: TopbarSimpleProps) => {
  return (
    <Topbar className={className}>
      <TopbarContent>
        <TopbarTitle>{title}</TopbarTitle>
        {description && <TopbarDescription>{description}</TopbarDescription>}
      </TopbarContent>
      {action && <TopbarAction>{action}</TopbarAction>}
    </Topbar>
  )
}
