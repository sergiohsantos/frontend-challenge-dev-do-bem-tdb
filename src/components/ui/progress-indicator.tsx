import { CheckCircle2, Loader2 } from "lucide-react"
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
  const percentage = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0
  const stepNumber = Math.min(Math.max(currentStep, 0), totalSteps)

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      <div role="progressbar" aria-label="Progresso das etapas" aria-valuenow={percentage}
        aria-valuemin={0} aria-valuemax={100} aria-valuetext={`Etapa ${stepNumber} de ${totalSteps}; ${percentage}% concluído`}>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span>Etapa {stepNumber} de {totalSteps}</span>
          {showPercentage && <span>{percentage}% concluído</span>}
        </div>
        {variant !== "compact" && <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
        </div>}
      </div>
      <ol className="grid min-w-0 grid-cols-2 gap-3 sm:flex sm:items-start">
        {steps.map((step, index) => (
          <li key={`step-${index}-${step.label}`} aria-current={step.current ? "step" : undefined}
            className="flex min-w-0 flex-1 items-start gap-2 sm:flex-col sm:items-center sm:text-center">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium",
              step.completed ? "border-primary bg-primary text-primary-foreground" : step.current ? "border-primary bg-primary/10 text-primary" : "border-muted bg-muted text-muted-foreground")}>
              {step.completed ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn("min-w-0 break-words text-xs font-medium", step.current ? "text-foreground" : "text-muted-foreground")}>
              {step.label}{step.completed && <span className="sr-only"> — concluída</span>}
            </span>
          </li>
        ))}
      </ol>
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

