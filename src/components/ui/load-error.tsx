import { Button } from "@/components/ui/button"

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
    <p>{message}</p><Button type="button" variant="outline" onClick={onRetry}>Tentar novamente</Button>
  </div>
}
