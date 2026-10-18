import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Capacity { activeCases: number; availableCases: number | null; maxActiveCases: number | null; acceptingNewCases: boolean }
export function VolunteerCapacity({ volunteerId }: { volunteerId?: number }) {
  const [data, setData] = useState<Capacity | null>(null)
  const [maximum, setMaximum] = useState("")
  const [accepting, setAccepting] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [revision, setRevision] = useState(0)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setError(""); setData(null)
    apiFetch<Capacity>(volunteerId ? `/api/admin/volunteers/${volunteerId}/capacity` : "/api/volunteers/me/capacity", { signal: controller.signal }, getToken())
      .then(value => { if (!controller.signal.aborted) { setData(value); setMaximum(value.maxActiveCases === null ? "" : String(value.maxActiveCases)); setAccepting(value.acceptingNewCases) } })
      .catch(() => { if (!controller.signal.aborted) setError("Não foi possível carregar a capacidade declarada.") })
    return () => controller.abort()
  }, [volunteerId, revision])
  async function save() {
    if (!data || saving) return
    const value = maximum.trim() === "" ? null : Number(maximum)
    if (value !== null && (!Number.isInteger(value) || value < 0 || value > 1000)) { setError("Informe um limite inteiro de 0 a 1000 ou deixe em branco."); return }
    setSaving(true); setError(""); setSaved(false)
    try {
      setData(await apiFetch<Capacity>("/api/volunteers/me/capacity", { method: "PUT", body: JSON.stringify({ maxActiveCases: value, acceptingNewCases: accepting }) }, getToken()))
      setSaved(true)
    } catch { setError("Não foi possível salvar a capacidade. Tente novamente.") }
    finally { setSaving(false) }
  }
  return <Card className="mb-6"><CardHeader><CardTitle>Capacidade de acompanhamento</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">Limite declarado de casos ativos. Não representa horários livres e não altera encaminhamentos existentes.</p>
    {data ? <><p>{data.activeCases} caso(s) ativo(s) · {data.availableCases === null ? "Limite não informado" : `${data.availableCases} vaga(s) declarada(s)`}{!data.acceptingNewCases && " · Novos casos pausados"}</p>
      {!volunteerId && <><label className="grid gap-2">Máximo de casos ativos<Input disabled={saving} type="number" min={0} max={1000} step={1} value={maximum} onChange={event => { setMaximum(event.target.value); setSaved(false) }} placeholder="Não informado" /></label><label className="flex gap-2"><input disabled={saving} type="checkbox" checked={accepting} onChange={event => { setAccepting(event.target.checked); setSaved(false) }} />Disponível para novos casos</label><Button disabled={saving} onClick={() => void save()}>{saving ? "Salvando..." : "Salvar capacidade"}</Button></>}
    </> : !error && <p role="status">Carregando capacidade...</p>}
    {error && <div role="alert"><p>{error}</p>{!data && <Button variant="outline" onClick={() => setRevision(value => value + 1)}>Recarregar capacidade</Button>}</div>}
    {saved && <p role="status">Capacidade salva no servidor.</p>}
  </CardContent></Card>
}
