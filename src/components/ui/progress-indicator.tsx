import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleStep {
  label: string
  description?: string
  completed: boolean
  current: boolean
}

interface ProgressIndicatorProps {
  steps: SimpleStep[]
  currentStep: number
  variant?: "default" | "compact"
  className?: string
  showPercentage?: boolean
}

export function ProgressIndicator({ 
  steps, 
  currentStep, 
  variant = "default",
  className,
  showPercentage = false
}: ProgressIndicatorProps) {
  const totalSteps = steps.length
  const completedSteps = steps.filter(s => s.completed).length
  const percentage = Math.round((completedSteps / totalSteps) * 100)

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        {/* Compact step indicators */}
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <div key={`step-${index}-${step.label}`} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all",
                    step.completed && "border-primary bg-primary text-primary-foreground",
                    step.current && !step.completed && "border-primary bg-primary/10 text-primary",
                    !step.completed && !step.current && "border-muted bg-muted text-muted-foreground"
                  )}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span 
                  className={cn(
                    "mt-1.5 text-center text-xs font-medium max-w-[80px] truncate",
                    step.completed && "text-primary",
                    step.current && !step.completed && "text-foreground",
                    !step.completed && !step.current && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 min-w-[20px]",
                    step.completed ? "bg-primary" : "bg-muted"
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      {/* Visual Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Etapa {currentStep} de {totalSteps}
          </span>
          {showPercentage && (
            <span className="font-semibold text-primary">
              {percentage}% concluído
            </span>
          )}
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Indicators with Labels */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={`step-${index}-${step.label}`} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  step.completed && "border-primary bg-primary text-primary-foreground",
                  step.current && !step.completed && "border-primary bg-primary/10 text-primary",
                  !step.completed && !step.current && "border-muted bg-muted text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : step.current ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Circle className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <span 
                className={cn(
                  "mt-2 text-center text-xs font-medium",
                  step.completed && "text-primary",
                  step.current && !step.completed && "text-foreground",
                  !step.completed && !step.current && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1",
                  step.completed ? "bg-primary" : "bg-muted"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple linear progress for loading states
interface LoadingProgressProps {
  message?: string
  className?: string
}

export function LoadingProgress({ message = "Carregando...", className }: LoadingProgressProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)} role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm font-medium text-muted-foreground">{message}</span>
    </div>
  )
}

// Action feedback component
interface ActionFeedbackProps {
  type: "success" | "error" | "warning" | "info"
  message: string
  description?: string
  className?: string
}

export function ActionFeedback({ type, message, description, className }: ActionFeedbackProps) {
  const styles = {
    success: "bg-success/10 border-success/30 text-success",
    error: "bg-destructive/10 border-destructive/30 text-destructive",
    warning: "bg-warning/10 border-warning/30 text-warning",
    info: "bg-primary/10 border-primary/30 text-primary"
  }

  return (
    <div 
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        styles[type],
        className
      )}
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{message}</p>
        {description && (
          <p className="mt-1 text-sm opacity-80">{description}</p>
        )}
      </div>
    </div>
  )
}
