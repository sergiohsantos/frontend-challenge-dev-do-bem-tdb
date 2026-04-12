import * as React from "react"
import { CheckCircle2, XCircle, Loader2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionFeedbackProps {
  status: "idle" | "loading" | "success" | "error"
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
  className?: string
  onSuccess?: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

export function ActionFeedback({
  status,
  loadingMessage = "Processando...",
  successMessage = "Concluído com sucesso!",
  errorMessage = "Ocorreu um erro. Tente novamente.",
  className,
  onSuccess,
  autoHide = true,
  autoHideDelay = 3000,
}: ActionFeedbackProps) {
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    if (status === "success" && autoHide) {
      const timer = setTimeout(() => {
        setVisible(false)
        onSuccess?.()
      }, autoHideDelay)
      return () => clearTimeout(timer)
    }
    setVisible(true)
  }, [status, autoHide, autoHideDelay, onSuccess])

  if (status === "idle" || !visible) return null

  const configs = {
    loading: {
      icon: Loader2,
      message: loadingMessage,
      className: "bg-muted text-muted-foreground",
      iconClassName: "animate-spin",
    },
    success: {
      icon: CheckCircle2,
      message: successMessage,
      className: "bg-success/10 text-success border-success/20",
      iconClassName: "",
    },
    error: {
      icon: XCircle,
      message: errorMessage,
      className: "bg-destructive/10 text-destructive border-destructive/20",
      iconClassName: "",
    },
  }

  const config = configs[status]
  const Icon = config.icon

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4 transition-all duration-300",
        config.className,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", config.iconClassName)} aria-hidden="true" />
      <span className="text-sm font-medium">{config.message}</span>
    </div>
  )
}

// Toast-like notification component
interface ToastNotificationProps {
  show: boolean
  type: "success" | "error" | "info"
  message: string
  onClose: () => void
}

export function ToastNotification({ show, type, message, onClose }: ToastNotificationProps) {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const configs = {
    success: {
      icon: CheckCircle2,
      className: "bg-success text-success-foreground",
    },
    error: {
      icon: XCircle,
      className: "bg-destructive text-destructive-foreground",
    },
    info: {
      icon: Info,
      className: "bg-primary text-primary-foreground",
    },
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform",
        "flex items-center gap-3 rounded-full px-6 py-3 shadow-lg",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        config.className
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
