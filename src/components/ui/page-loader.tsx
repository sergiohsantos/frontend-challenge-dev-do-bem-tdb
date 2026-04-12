import { cn } from "@/lib/utils"
import { Loader2, Heart } from "lucide-react"

interface PageLoaderProps {
  message?: string
  variant?: "default" | "minimal" | "branded"
  className?: string
}

export function PageLoader({ 
  message = "Carregando...", 
  variant = "default",
  className 
}: PageLoaderProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (variant === "branded") {
    return (
      <div className={cn("flex flex-1 items-center justify-center py-24", className)}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
              <Heart className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">{message}</p>
            <p className="mt-1 text-sm text-muted-foreground">Por favor, aguarde um momento</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-1 items-center justify-center py-24", className)}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  )
}

interface CardSkeletonProps {
  className?: string
  rows?: number
}

export function CardSkeleton({ className, rows = 3 }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 animate-pulse", className)}>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-1/3 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-muted" style={{ width: `${85 - i * 15}%` }} />
        ))}
      </div>
    </div>
  )
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 animate-pulse", className)}>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-16 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ className, rows = 5 }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-xl border bg-card animate-pulse", className)}>
      <div className="border-b p-4">
        <div className="flex gap-4">
          <div className="h-4 w-1/4 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
          <div className="h-4 w-1/4 rounded bg-muted" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b p-4 last:border-b-0">
          <div className="flex gap-4">
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-4 w-1/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-5 w-72 rounded bg-muted" />
      </div>
      
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={3} />
        </div>
        <div className="space-y-6">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      </div>
    </div>
  )
}
