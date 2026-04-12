import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ConfirmationDialogProps {
  // Modo trigger (não controlado)
  trigger?: ReactNode
  // Modo controlado
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // Conteúdo
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive" | "warning" | "success"
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmationDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  const iconStyles = {
    default: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success"
  }

  const buttonStyles = {
    default: "",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    success: "bg-success text-success-foreground hover:bg-success/90"
  }

  const Icon = variant === "destructive" ? AlertTriangle : variant === "warning" ? HelpCircle : CheckCircle2

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <AlertDialogTrigger asChild>
          {trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className={cn("mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full", iconStyles[variant])}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
          <AlertDialogCancel 
            onClick={onCancel}
            className="h-12 min-w-[140px] text-base"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={cn(
              "h-12 min-w-[140px] text-base",
              buttonStyles[variant]
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Inline confirmation for simple actions
interface InlineConfirmProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

export function InlineConfirm({
  message,
  onConfirm,
  onCancel,
  confirmText = "Sim",
  cancelText = "Não",
  variant = "default"
}: InlineConfirmProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/50 p-4" role="alertdialog">
      <p className="text-center text-sm font-medium text-foreground">{message}</p>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCancel}
          className="min-w-[80px]"
        >
          {cancelText}
        </Button>
        <Button 
          variant={variant}
          size="sm" 
          onClick={onConfirm}
          className="min-w-[80px]"
        >
          {confirmText}
        </Button>
      </div>
    </div>
  )
}
