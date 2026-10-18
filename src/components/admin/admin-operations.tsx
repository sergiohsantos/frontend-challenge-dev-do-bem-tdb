import { useTrackingOptions } from "@/hooks/use-tracking-options"
import { OperationTracking, type Tracking } from "./operation-tracking"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarDays, Clock3, RefreshCw } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { appointmentTimestamp, formatDateTime, SERVICE_TIME_ZONE } from "@/lib/dates"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const categories = { approval: "Aprovações", assignment: "Sem profissional", scheduling: "Sem agendamento", reschedule: "Reagendamentos", confirmation: "Confirmações próximas", message: "Conversas para acompanhar" }
type Category = keyof typeof categories
interface Operation {
  tracking?: Tracking; id: string; kind: Category; reference: string; beneficiary: string; programName: string
  reason: string; priority: string; ageDays: number | null; ageBasis: string; targetUrl: string
}
interface Operations {
  generatedAt: string; total: number; counts: Partial<Record<Category, number>>; items: Operation[]
  programs: Array<{ code: string; name: string }>
  agenda: Array<{ id: number; beneficiary: string; professional: string; appointmentAt: string; status: string; confirmed: boolean; targetUrl: string }>
}
const regions = ["Sudeste", "Sul", "Nordeste", "Centro-Oeste", "Norte", "Não definida"]
const controlClass = "h-11 min-w-0 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function appointmentLabel(value: string) {
  const timestamp = appointmentTimestamp(value.slice(0, 10), value.slice(11, 19))
  return timestamp === null ? "Data não informada" : new Intl.DateTimeFormat("pt-BR", { timeZone: SERVICE_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(timestamp)
}

export function AdminOperations() {
  const trackingOptions = useTrackingOptions()
  const [data, setData] = useState<Operations | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState("all")
  const [program, setProgram] = useState("all")
  const [region, setRegion] = useState("all")
  const [period, setPeriod] = useState("all")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  useEffect(() => { const timer = window.setTimeout(() => { setQuery(search.trim()); setPage(1) }, 350); return () => window.clearTimeout(timer) }, [search])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(false)
    const params = new URLSearchParams({ kind, program, region, period, search: query, page: String(page) })
    apiFetch<Operations>(`/api/admin/operations?${params}`, { signal: controller.signal, cache: "no-store" }, getToken())
      .then(value => { if (!controller.signal.aborted) setData(value) })
      .catch(() => { if (!controller.signal.aborted) { setData(null); setError(true) } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [kind, program, region, period, query, page, revision])
  const filter = (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLSelectElement>) => { setter(event.target.value); setPage(1) }
  return <section aria-labelledby="operations-title" className="space-y-4">
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle id="operations-title">Precisa da minha ação</CardTitle><CardDescription>Prioridade, contexto e acesso direto ao fluxo de cada caso. Nenhuma etapa é alterada automaticamente.</CardDescription></div>
        <Button variant="outline" onClick={() => setRevision(value => value + 1)} disabled={loading} className="shrink-0 gap-2"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar operação</Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1 text-sm">Pendência<select aria-label="Pendência" className={controlClass} value={kind} onChange={filter(setKind)}><option value="all">Todas as pendências</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Programa<select aria-label="Programa" className={controlClass} value={program} onChange={filter(setProgram)}><option value="all">Todos os programas</option>{data?.programs.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Região<select aria-label="Região" className={controlClass} value={region} onChange={filter(setRegion)}><option value="all">Todas as regiões</option>{regions.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Origem da pendência<select aria-label="Origem da pendência" className={controlClass} value={period} onChange={filter(setPeriod)}><option value="all">Todos os períodos</option><option value="7d">Criada nos últimos 7 dias</option><option value="30d">Criada nos últimos 30 dias</option><option value="90d">Criada nos últimos 90 dias</option><option value="ytd">Criada neste ano</option></select></label>
          <label className="grid gap-1 text-sm">Buscar na fila<Input className="h-11 rounded-xl" value={search} onChange={event => setSearch(event.target.value)} maxLength={100} placeholder="Nome ou referência" /></label>
        </div>
        <p className="text-xs text-muted-foreground">Os filtros acima se aplicam à fila. A agenda acompanha programa e região; os indicadores gerais abaixo são consolidados. Pendências antigas permanecem visíveis em “Todos os períodos”.</p>
        {loading ? <p role="status" className="rounded-xl border p-6">Carregando operação...</p> : error ? <div role="alert" className="rounded-xl border border-destructive/30 p-5"><p>Não foi possível carregar a operação. As pendências estão indisponíveis, não zeradas.</p><p className="mt-2 text-sm text-muted-foreground">As demais áreas continuam acessíveis pelo menu. Se o backend ainda não recebeu esta atualização, use os fluxos existentes.</p><Button variant="outline" className="mt-3" onClick={() => setRevision(value => value + 1)}>Tentar novamente a operação</Button></div> : data && <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{Object.entries(categories).map(([key, label]) => <div key={key} className="rounded-xl bg-muted/50 p-3"><p className="text-2xl font-bold">{data.counts[key as Category] || 0}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>
          <div className="flex flex-wrap justify-between gap-2 text-sm"><p role="status">{data.total} pendência(s) neste recorte</p><p className="text-muted-foreground">Atualizado em {formatDateTime(data.generatedAt)}</p></div>
          {data.items.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Nenhuma pendência encontrada neste recorte.</p> : <ol className="space-y-3">{data.items.map(item => <li key={item.id} className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><Badge variant={item.priority === "urgente" ? "destructive" : "secondary"}>{categories[item.kind]}</Badge>{item.priority !== "normal" && <span className="text-xs font-semibold">Prioridade {item.priority}</span>}<span className="text-xs text-muted-foreground">{item.reference}</span></div><p className="break-words font-semibold">{item.beneficiary}</p><p className="text-sm">{item.reason}</p><p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" aria-hidden="true" />{item.ageDays === null ? "Idade não disponível" : `${item.ageDays} dia(s) · ${item.ageBasis}`} · {item.programName}</p></div>
            <div className="space-y-3">{trackingOptions.available && <OperationTracking operation={item.id} tracking={item.tracking} owners={trackingOptions.owners} onSaved={() => setRevision(value => value + 1)} />}<Button variant="outline" asChild className="shrink-0"><Link to={item.targetUrl} aria-label={`Ver pendência ${item.reference} de ${item.beneficiary}`}>Ver pendência<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
          </li>)}</ol>}
          <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Anterior</Button><span className="text-sm">Página {page}</span><Button variant="outline" disabled={page * 20 >= data.total} onClick={() => setPage(value => value + 1)}>Próxima</Button></div>
          <p className="text-xs text-muted-foreground">A idade indica a origem exibida, não um prazo de serviço. Conversas são sinais de acompanhamento e podem ter sido respondidas por outro canal.</p>
        </>}
      </CardContent>
    </Card>
    {!loading && !error && data && <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Agenda dos próximos 7 dias</CardTitle><CardDescription>Consultas ativas, em horário de Brasília. Confirmação indica o registro disponível na consulta.</CardDescription></CardHeader><CardContent>
      {data.agenda.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma consulta futura neste recorte.</p> : <ul className="grid gap-3 lg:grid-cols-2">{data.agenda.map(item => <li key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{appointmentLabel(item.appointmentAt)}</p><Badge variant={item.confirmed ? "secondary" : "outline"}>{item.confirmed ? "Confirmada" : "Sem confirmação"}</Badge></div><p className="mt-2 break-words">{item.beneficiary}</p><p className="text-sm text-muted-foreground">{item.professional} · {item.status}</p><Link className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-4" to={item.targetUrl}>Abrir caso da consulta {item.id}</Link></li>)}</ul>}
    </CardContent></Card>}
  </section>
}
