import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react"
import { useState } from "react"

type AlertType = "info" | "success" | "warning" | "error"

interface AlertBannerProps {
  type?: AlertType
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const alertStyles: Record<AlertType, {
  icon: typeof Info
  container: string
  iconColor: string
  titleColor: string
}> = {
  info: {
    icon: Info,
    container: "bg-primary/5 border-primary/20",
    iconColor: "text-primary",
    titleColor: "text-primary",
  },
  success: {
    icon: CheckCircle2,
    container: "bg-success/5 border-success/20",
    iconColor: "text-success",
    titleColor: "text-success",
  },
  warning: {
    icon: AlertTriangle,
    container: "bg-warning/5 border-warning/30",
    iconColor: "text-warning",
    titleColor: "text-warning",
  },
  error: {
    icon: AlertCircle,
    container: "bg-destructive/5 border-destructive/20",
    iconColor: "text-destructive",
    titleColor: "text-destructive",
  },
}

export function AlertBanner({
  type = "info",
  title,
  message,
  dismissible = false,
  onDismiss,
  action,
  className,
}: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const styles = alertStyles[type]
  const Icon = styles.icon

  if (isDismissed) return null

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-4",
        styles.container,
        className
      )}
    >
      <div className={cn("flex-shrink-0 mt-0.5", styles.iconColor)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn("font-semibold text-sm", styles.titleColor)}>{title}</h4>
        )}
        <p className={cn("text-sm text-foreground", title && "mt-1")}>{message}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              "mt-2 text-sm font-medium underline-offset-4 hover:underline",
              styles.iconColor
            )}
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Fechar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

interface MessageBannerProps {
  children: React.ReactNode
  icon?: React.ReactNode
  variant?: "default" | "highlight" | "subtle"
  className?: string
}

export function MessageBanner({
  children,
  icon,
  variant = "default",
  className,
}: MessageBannerProps) {
  const variantStyles = {
    default: "bg-muted/50 border-border",
    highlight: "bg-primary/5 border-primary/20",
    subtle: "bg-background border-border",
  }

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border p-4",
      variantStyles[variant],
      className
    )}>
      {icon && (
        <div className="flex-shrink-0 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0 text-sm text-foreground">
        {children}
      </div>
    </div>
  )
}
