import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type TrendDirection = "up" | "down" | "neutral"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: TrendDirection
    label?: string
  }
  variant?: "default" | "primary" | "success" | "warning" | "accent"
  className?: string
}

const variantStyles = {
  default: {
    iconBg: "bg-muted",
    iconColor: "text-foreground",
  },
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  accent: {
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
}

const trendStyles = {
  up: {
    icon: TrendingUp,
    color: "text-success",
    bg: "bg-success/10",
  },
  down: {
    icon: TrendingDown,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  neutral: {
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]
  const TrendIcon = trend ? trendStyles[trend.direction].icon : null

  return (
    <Card className={cn("relative overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {icon && (
            <div className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl", styles.iconBg)}>
              <div className={cn("[&>svg]:h-5 [&>svg]:w-5", styles.iconColor)}>
                {icon}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
              </p>
              {trend && TrendIcon && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  trendStyles[trend.direction].bg,
                  trendStyles[trend.direction].color
                )}>
                  <TrendIcon className="h-3 w-3" />
                  {trend.value > 0 && "+"}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
            {trend?.label && (
              <p className="mt-0.5 text-xs text-muted-foreground">{trend.label}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const gridClasses = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  }

  return (
    <div className={cn("grid gap-4", gridClasses[columns], className)}>
      {children}
    </div>
  )
}

interface HighlightStatProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  cta?: {
    label: string
    href: string
  }
  variant?: "primary" | "accent" | "success"
  className?: string
}

export function HighlightStat({
  title,
  value,
  description,
  icon,
  variant = "primary",
  className,
}: HighlightStatProps) {
  const bgStyles = {
    primary: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20",
    accent: "bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/20",
    success: "bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20",
  }

  const textStyles = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
  }

  return (
    <Card className={cn("border-2", bgStyles[variant], className)}>
      <CardContent className="p-6 text-center">
        {icon && (
          <div className={cn("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background/80 shadow-sm")}>
            <div className={cn("[&>svg]:h-7 [&>svg]:w-7", textStyles[variant])}>
              {icon}
            </div>
          </div>
        )}
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("mt-2 text-4xl font-bold tracking-tight", textStyles[variant])}>
          {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
        </p>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
