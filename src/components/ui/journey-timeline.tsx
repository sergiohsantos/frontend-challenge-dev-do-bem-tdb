import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Clock } from "lucide-react"

type StepStatus = "completed" | "current" | "upcoming"

interface TimelineStep {
  id: string
  title: string
  description?: string
  date?: string
  status: StepStatus
}

interface JourneyTimelineProps {
  steps: TimelineStep[]
  className?: string
}

const stepConfig: Record<StepStatus, {
  icon: typeof CheckCircle2
  iconClass: string
  lineClass: string
  titleClass: string
}> = {
  completed: {
    icon: CheckCircle2,
    iconClass: "bg-success text-success-foreground",
    lineClass: "bg-success",
    titleClass: "text-foreground",
  },
  current: {
    icon: Clock,
    iconClass: "bg-primary text-primary-foreground ring-4 ring-primary/20",
    lineClass: "bg-border",
    titleClass: "text-foreground font-semibold",
  },
  upcoming: {
    icon: Circle,
    iconClass: "bg-muted text-muted-foreground",
    lineClass: "bg-border",
    titleClass: "text-muted-foreground",
  },
}

// Normalize status from API to expected format
function normalizeStatus(status: string): StepStatus {
  const lower = (status || "").toLowerCase().trim()
  
  if (lower === "completed" || lower === "done" || lower === "finalizado" || lower === "concluido") {
    return "completed"
  }
  if (lower === "current" || lower === "in_progress" || lower === "in-progress" || lower === "active" || lower === "em_andamento") {
    return "current"
  }
  // Default to upcoming for any other status
  return "upcoming"
}

export function JourneyTimeline({ steps, className }: JourneyTimelineProps) {
  return (
    <div className={cn("space-y-0", className)} role="list" aria-label="Linha do tempo da jornada">
      {steps.map((step, index) => {
        const normalizedStatus = normalizeStatus(step.status)
        const config = stepConfig[normalizedStatus]
        const Icon = config.icon
        const isLast = index === steps.length - 1

        return (
          <div key={step.id ?? `step-${index}`} className="relative flex gap-4" role="listitem">
            {/* Line */}
            {!isLast && (
              <div 
                className={cn(
                  "absolute left-5 top-12 h-[calc(100%-24px)] w-0.5 -translate-x-1/2",
                  config.lineClass
                )}
                aria-hidden="true"
              />
            )}
            
            {/* Icon */}
            <div 
              className={cn(
                "relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                config.iconClass
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>

            {/* Content */}
            <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className={cn("text-base", config.titleClass)}>{step.title}</h4>
                {step.date && (
                  <span className="text-xs text-muted-foreground">{step.date}</span>
                )}
              </div>
              {step.description && (
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
