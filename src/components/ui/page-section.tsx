import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  backLink?: {
    href: string
    label: string
  }
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    href: string
  }
  className?: string
}

export function SectionHeader({
  title,
  description,
  icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <Button variant="ghost" size="sm" asChild>
          <Link to={action.href}>
            {action.label}
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  )
}

interface ContentSectionProps {
  children: React.ReactNode
  className?: string
}

export function ContentSection({ children, className }: ContentSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {children}
    </section>
  )
}

interface PageContainerProps {
  children: React.ReactNode
  size?: "default" | "narrow" | "wide"
  className?: string
}

export function PageContainer({ children, size = "default", className }: PageContainerProps) {
  const sizeStyles = {
    narrow: "max-w-4xl",
    default: "max-w-7xl",
    wide: "max-w-[1400px]",
  }

  return (
    <div className={cn("container mx-auto px-4", sizeStyles[size], className)}>
      {children}
    </div>
  )
}

interface TwoColumnLayoutProps {
  main: React.ReactNode
  sidebar: React.ReactNode
  sidebarPosition?: "left" | "right"
  className?: string
}

export function TwoColumnLayout({
  main,
  sidebar,
  sidebarPosition = "right",
  className,
}: TwoColumnLayoutProps) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-3", className)}>
      {sidebarPosition === "left" && (
        <div className="space-y-6">{sidebar}</div>
      )}
      <div className={cn("space-y-6", sidebarPosition === "right" ? "lg:col-span-2" : "lg:col-span-2 lg:order-first")}>
        {main}
      </div>
      {sidebarPosition === "right" && (
        <div className="space-y-6">{sidebar}</div>
      )}
    </div>
  )
}
