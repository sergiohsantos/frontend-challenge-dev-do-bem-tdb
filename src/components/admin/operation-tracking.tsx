import { useState } from "react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { formatDateTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export interface Tracking { ownerId: number | null; dueAt: string | null; notes: string; version: number; overdue: boolean }
export interface Owner { id: number; name: string }
export function OperationTracking({ operation, tracking, owners, onSaved }: { operation: string; tracking?: Tracking; owners: Owner[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [owner, setOwner] = useState("")
  const [due, setDue] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [conflict, setConflict] = useState(false)
  function edit() {
    setOwner(tracking?.ownerId ? String(tracking.ownerId) : "")
    // datetime-local uses the browser's local time; always submit an explicit offset as UTC.
    const date = tracking?.dueAt ? new Date(tracking.dueAt) : null
    setDue(date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "")
    setNotes(tracking?.notes || ""); setError(""); setConflict(false); setOpen(true)
  }
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (saving || conflict) return
    setSaving(true); setError("")
    try {
      await apiFetch(`/api/admin/operation-tracking/${encodeURIComponent(operation)}`, { method: "PUT", body: JSON.stringify({ ownerId: owner ? Number(owner) : null, dueAt: due ? new Date(due).toISOString() : null, notes, version: tracking?.version || 0 }) }, getToken())
      setOpen(false); onSaved()
    } catch (err) {
      const status = typeof err === "object" && err !== null && "status" in err ? err.status : null
      setConflict(status === 409 || status === 404)
      setError(status === 409 || status === 404 ? "A pendência mudou. Feche esta janela e atualize a operação antes de editar novamente." : "Não foi possível salvar o acompanhamento. Tente novamente.")
    } finally { setSaving(false) }
  }
  return <div className="space-y-2 text-sm">
    <p>{owners.find(value => value.id === tracking?.ownerId)?.name || "Sem responsável"}{tracking?.dueAt && ` · Prazo: ${formatDateTime(tracking.dueAt)}`}{tracking?.overdue && " · Prazo vencido"}</p>
    <Button variant="outline" onClick={edit}>Definir responsável e prazo</Button>
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value) }}><DialogContent><DialogHeader><DialogTitle>Acompanhar pendência</DialogTitle><DialogDescription>{operation}. Este registro não altera o atendimento.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={event => void save(event)}><fieldset disabled={saving || conflict} className="space-y-4"><label className="grid gap-2">Responsável<select aria-label="Responsável" className="h-11 rounded border bg-background px-3" value={owner} onChange={event => setOwner(event.target.value)}><option value="">Não atribuído</option>{owners.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
        <label className="grid gap-2">Prazo (horário deste dispositivo)<Input type="datetime-local" value={due} onChange={event => setDue(event.target.value)} /></label>
        <label className="grid gap-2">Observação operacional<Textarea maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} /></label><Button type="submit">{saving ? "Salvando..." : "Salvar acompanhamento"}</Button></fieldset>{error && <p role="alert">{error}</p>}</form>
    </DialogContent></Dialog>
  </div>
}
