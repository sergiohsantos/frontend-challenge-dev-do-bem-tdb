import { HelpCircle, Info, AlertCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ContextualHelpProps {
  content: string
  variant?: "help" | "info" | "warning"
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function ContextualHelp({ 
  content, 
  variant = "help",
  side = "top",
  className 
}: ContextualHelpProps) {
  const Icon = variant === "info" ? Info : variant === "warning" ? AlertCircle : HelpCircle
  const iconColor = variant === "warning" ? "text-warning" : "text-muted-foreground hover:text-foreground"

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              iconColor,
              className
            )}
            aria-label="Ajuda"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[250px] text-sm">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Field help - combines label with contextual help
interface FieldHelpProps {
  label: string
  helpText: string
  required?: boolean
  htmlFor?: string
  className?: string
}

export function FieldHelp({ label, helpText, required, htmlFor, className }: FieldHelpProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={htmlFor} className="text-base font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <ContextualHelp content={helpText} />
    </div>
  )
}

// Inline help message shown below field
interface InlineHelpProps {
  message: string
  variant?: "default" | "error" | "success"
  className?: string
}

export function InlineHelp({ message, variant = "default", className }: InlineHelpProps) {
  const styles = {
    default: "text-muted-foreground",
    error: "text-destructive",
    success: "text-success"
  }

  return (
    <p className={cn("mt-1.5 text-sm", styles[variant], className)} role={variant === "error" ? "alert" : undefined}>
      {message}
    </p>
  )
}

// Quick action card with clear labels
interface QuickActionProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
  href?: string
  className?: string
}

export function QuickAction({ icon, title, description, onClick, href, className }: QuickActionProps) {
  const Component = href ? "a" : "button"
  
  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Component>
  )
}
