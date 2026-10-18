import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { formatDateTime } from "@/lib/dates"
import { Button } from "@/components/ui/button"

interface Delivery { id: string; messageId: string; status: string; occurredAt: string; timestampSource: string; recipient: string | null; errorCode: string | null }
const labels: Record<string, string> = { sent: "Enviada", delivered: "Entregue", read: "Lida", failed: "Falhou" }
export function WhatsAppDeliveryHistory() {
  const [data, setData] = useState<{ available: boolean; total: number; items: Delivery[] } | null>(null)
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setData(null); setError(false)
    apiFetch<NonNullable<typeof data>>(`/api/admin/whatsapp/deliveries?page=${page}${status ? `&status=${status}` : ""}`, { signal: controller.signal }, getToken())
      .then(value => { if (!controller.signal.aborted) setData(value) }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [status, page, revision])
  return <section aria-label="Histórico de entrega WhatsApp" className="space-y-3 rounded-2xl border p-4"><h3 className="font-bold">Histórico de entrega WhatsApp</h3><p className="text-sm text-muted-foreground">Aceitação pela Meta não comprova entrega. Os eventos abaixo vêm do webhook; mensagens anteriores à ativação não têm histórico.</p>
    <div className="flex flex-wrap gap-3"><label>Status <select className="h-10 rounded border bg-background px-3" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="">Todos</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><Button variant="outline" onClick={() => setRevision(value => value + 1)}>Atualizar entregas</Button></div>
    {error ? <p role="alert">Não foi possível consultar as entregas. Tente atualizar.</p> : !data ? <p role="status">Carregando entregas...</p> : !data.available ? <p>Histórico ainda não habilitado neste ambiente. Os envios existentes continuam independentes deste recurso.</p> : <><p>{data.total} evento(s)</p><ul className="space-y-3">{data.items.map(value => <li key={value.id} className="break-all rounded border p-3 text-sm"><p className="font-semibold">{labels[value.status]} · {value.recipient || "Destinatário não informado"}</p><p>{formatDateTime(value.occurredAt)}{value.timestampSource === "received" && " (recebimento do webhook)"}</p>{value.errorCode && <p>Código da Meta: {value.errorCode}</p>}<details><summary>Referência técnica</summary>{value.messageId}</details></li>)}</ul>{!data.total && <p>Nenhum evento neste recorte.</p>}<div className="flex gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Eventos anteriores</Button><span>Página {page}</span><Button variant="outline" disabled={page * 20 >= data.total} onClick={() => setPage(value => value + 1)}>Mais eventos</Button></div></>}
  </section>
}
