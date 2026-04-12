import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, AlertCircle, XCircle, Circle } from "lucide-react"

type StatusType = "completed" | "in-progress" | "pending" | "attention" | "cancelled"

interface StatusCardProps {
  status: StatusType
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

const statusConfig: Record<StatusType, { 
  icon: typeof CheckCircle2
  label: string
  bgColor: string
  textColor: string
  iconColor: string
}> = {
  completed: {
    icon: CheckCircle2,
    label: "Concluído",
    bgColor: "bg-success/10",
    textColor: "text-success",
    iconColor: "text-success",
  },
  "in-progress": {
    icon: Clock,
    label: "Em andamento",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    iconColor: "text-primary",
  },
  pending: {
    icon: Circle,
    label: "Pendente",
    bgColor: "bg-muted",
    textColor: "text-muted-foreground",
    iconColor: "text-muted-foreground",
  },
  attention: {
    icon: AlertCircle,
    label: "Atenção",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
    iconColor: "text-warning",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelado",
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
    iconColor: "text-destructive",
  },
}

export function StatusCard({ status, title, description, className, children }: StatusCardProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn("rounded-xl border border-border p-4 md:p-6", className)}>
      <div className="flex items-start gap-4">
        <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full", config.bgColor)}>
          <Icon className={cn("h-6 w-6", config.iconColor)} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", config.bgColor, config.textColor)}>
              {config.label}
            </span>
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {config.label}
    </span>
  )
}
