import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock3, Download, HardDrive, Info, Loader2, RefreshCw, Server, Zap, type LucideIcon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchInfrastructureHealth, infrastructureAge, infrastructureClock, infrastructureRate as percent, infrastructureRequestsPerSecond, summarizeInfrastructure, type HealthPeriod, type InfrastructureSnapshot } from '@/services/infrastructure-health.service'

const number = (value: number | null, digits = 0) => value === null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: digits })
function bytes(value: number | null) {
  if (value === null) return '—'
  const exponent = value > 0 ? Math.max(0, Math.min(3, Math.floor(Math.log(value) / Math.log(1024)))) : 0
  return `${number(value / 1024 ** exponent, 1)} ${['B', 'KB', 'MB', 'GB'][exponent]}`
}

function Metric({ title, value, detail, icon: Icon, orange = false }: { title: string; value: string; detail: string; icon: LucideIcon; orange?: boolean }) {
  return <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4 sm:p-5">
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${orange ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'bg-secondary/15 text-primary dark:text-secondary'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <div className="min-w-0"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 break-words text-2xl font-black tracking-tight sm:text-3xl">{value}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p></div>
  </div>
}

export default function AdminInfraestruturaPage() {
  const [snapshot, setSnapshot] = useState<InfrastructureSnapshot | null>(null)
  const [minutes, setMinutes] = useState<HealthPeriod>(10)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(true)
  const [revision, setRevision] = useState(0)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const controller = new AbortController()
    let busy = false
    async function refresh() {
      if (busy || document.visibilityState === 'hidden') return
      busy = true
      setRefreshing(true)
      try {
        const next = await fetchInfrastructureHealth(controller.signal)
        if (!controller.signal.aborted) { setSnapshot(next); setError(null) }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a infraestrutura agora.')
      } finally {
        busy = false
        if (!controller.signal.aborted) { setRefreshing(false); setNow(Date.now()) }
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    void refresh()
    const interval = window.setInterval(() => { void refresh() }, 60000)
    const clock = window.setInterval(() => setNow(Date.now()), 30000)
    document.addEventListener('visibilitychange', onVisible)
    return () => { controller.abort(); window.clearInterval(interval); window.clearInterval(clock); document.removeEventListener('visibilitychange', onVisible) }
  }, [revision])

  const summary = snapshot ? summarizeInfrastructure(snapshot, minutes, now) : null
  const alert = Boolean(error || summary?.stale || (summary?.totalErrorRate ?? 0) > 0)
  const status = error ? 'Atualização indisponível' : summary?.status || (refreshing ? 'Carregando métricas' : 'Sem dados')

  function exportSnapshot() {
    if (!snapshot || !summary) return
    const blob = new Blob([JSON.stringify({ ...snapshot, selectedMinutes: minutes, points: summary.points }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `infraestrutura-${snapshot.generatedAt.replace(/[:.]/g, '-')}.json`; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="tdb-admin-shell flex min-h-screen bg-background text-foreground">
    <AdminSidebar />
    <div className="min-w-0 flex-1 [&>header>div:first-child>div]:hidden sm:[&>header>div:first-child>div]:block"><AdminHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div><p className="text-sm text-muted-foreground">Admin / Infraestrutura</p>
            <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Infraestrutura</h1><Badge variant="outline" className="rounded-full border-secondary/40 bg-secondary/10 px-3 py-1">Entrega web</Badge></div>
            <p className="mt-2 text-muted-foreground">Saúde e desempenho da distribuição de conteúdo.</p>
          </div>
          <div className="space-y-3"><div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="infra-periodo">Período das métricas</label><select id="infra-periodo" className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-semibold" value={minutes} onChange={event => setMinutes(Number(event.target.value) as HealthPeriod)}>
              <option value={10}>Últimos 10 minutos</option><option value={30}>Últimos 30 minutos</option><option value={60}>Última hora</option>
            </select>
            <Button variant="outline" className="h-11 gap-2 rounded-xl" disabled={refreshing} onClick={() => setRevision(value => value + 1)}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />Atualizar</Button>
          </div><p className="text-xs text-muted-foreground">Atualização automática: 60 s · Horário de Brasília</p></div>
        </header>

        <div role="status" aria-live="polite" className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${alert ? 'border-amber-500/35 bg-amber-500/10' : 'border-border/70 bg-card'}`}>
          <span className="flex items-center gap-2 font-semibold">{refreshing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : alert ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <Activity className="h-4 w-4 text-secondary" aria-hidden="true" />}{status}</span>
          {summary && <span className="text-xs text-muted-foreground">Período: {infrastructureClock(summary.periodStart, true)} até {infrastructureClock(summary.periodEnd, true)}</span>}
        </div>
        {snapshot && summary && <div className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="font-semibold">Coleta publicada {infrastructureAge(summary.collectionAgeSeconds)}</dt><dd className="mt-1 text-xs text-muted-foreground">{infrastructureClock(snapshot.generatedAt, true)} · {summary.collectionStale ? 'Publicação atrasada' : 'Arquivo atualizado'}</dd></div>
            <div><dt className="font-semibold">Última amostra recebida: {infrastructureAge(summary.sampleAgeSeconds)}</dt><dd className="mt-1 text-xs text-muted-foreground">{summary.latestReceivedSample ? infrastructureClock(summary.latestReceivedSample, true) : 'Nenhuma amostra recebida na janela de coleta'}</dd></div>
          </dl>
          <p className="text-xs leading-relaxed text-muted-foreground">A coleta consulta o CloudWatch a cada minuto. As amostras podem chegar depois e os números recentes podem ser revisados pela fonte. Minutos sem amostras não comprovam ausência de tráfego nem indisponibilidade.</p>
        </div>}
        {error && <div role="alert" className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm">{error}{snapshot && ' Os últimos dados recebidos continuam visíveis abaixo.'}</div>}
        {(summary?.error4xxRate ?? 0) > 0 && <p className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm">Há respostas 4xx no período. Elas podem incluir acesso negado ou recurso não encontrado e não comprovam indisponibilidade. Estes agregados não identificam a rota ou a causa; consulte os logs para investigar.</p>}

        <Card className="rounded-3xl border-border/60 shadow-sm"><CardHeader><CardTitle className="text-xl font-black">CloudFront / CloudWatch</CardTitle><CardDescription>Tráfego total da distribuição, incluindo conteúdo estático e rotas de API.</CardDescription></CardHeader>
          <CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Requisições observadas" value={number(summary?.requests ?? null)} detail="Total nos minutos disponíveis do período" icon={Activity} />
            <Metric title="Média de requisições/s" value={infrastructureRequestsPerSecond(summary?.requestsPerSecond ?? null)} detail="Média nos minutos com amostras" icon={Zap} orange />
            <Metric title="Erros HTTP" value={percent(summary?.totalErrorRate ?? null)} detail={`4xx: ${percent(summary?.error4xxRate ?? null)} · 5xx: ${percent(summary?.error5xxRate ?? null)}`} icon={AlertTriangle} orange />
            <Metric title="Dados entregues" value={bytes(summary?.bytesDownloaded ?? null)} detail="Volume transferido pela distribuição" icon={HardDrive} />
          </div></CardContent>
        </Card>

        {!snapshot ? <Card className="rounded-3xl"><CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">{refreshing ? <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-hidden="true" /> : <Server className="h-8 w-8 text-muted-foreground" aria-hidden="true" />}<h2 className="font-bold">{refreshing ? 'Carregando a infraestrutura' : 'Métricas ainda indisponíveis'}</h2><p className="max-w-xl text-sm text-muted-foreground">Os gráficos serão exibidos quando o monitoramento publicar dados válidos.</p></CardContent></Card> : <>
          {summary?.missing && <p className="flex items-start gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Há amostras em {summary.sampleCount} de {minutes} minutos. Intervalos sem dados aparecem como lacunas, não como zero.</p>}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="min-w-0 rounded-3xl xl:col-span-2"><CardHeader><CardTitle className="text-xl font-black">Requisições por minuto</CardTitle><CardDescription>Volume observado · CloudWatch</CardDescription></CardHeader><CardContent>
              <div className="h-64 w-full" role="img" aria-label={`Gráfico de requisições por minuto. ${summary?.sampleCount || 0} minutos com dados.`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={summary?.chart} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <defs><linearGradient id="infra-requests" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#36a6ae" stopOpacity={0.4} /><stop offset="100%" stopColor="#36a6ae" stopOpacity={0.03} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="timestamp" tickFormatter={value => infrastructureClock(String(value))} minTickGap={35} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} /><YAxis allowDecimals={false} tickFormatter={value => number(Number(value))} width={52} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip labelFormatter={value => infrastructureClock(String(value), true)} formatter={value => [number(Number(value)), 'Requisições']} contentStyle={{ borderRadius: 12, background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <Area type="linear" dataKey="requests" stroke="#36a6ae" fill="url(#infra-requests)" strokeWidth={2.5} dot={{ r: 2, fill: '#36a6ae', strokeWidth: 0 }} connectNulls={false} isAnimationActive={false} />
              </AreaChart></ResponsiveContainer></div>
            </CardContent></Card>
            <Card className="min-w-0 rounded-3xl"><CardHeader><CardTitle className="text-xl font-black">Erros HTTP por minuto</CardTitle><CardDescription><span className="text-[#b45309] dark:text-orange-300">● 4xx</span><span className="ml-4 text-[#0f766e] dark:text-teal-300">● 5xx</span></CardDescription></CardHeader><CardContent>
              <div className="h-64 w-full" role="img" aria-label="Gráfico das taxas de erros 4xx e 5xx por minuto"><ResponsiveContainer width="100%" height="100%"><LineChart data={summary?.chart} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="timestamp" tickFormatter={value => infrastructureClock(String(value))} minTickGap={50} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} /><YAxis tickFormatter={value => percent(Number(value))} width={52} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip labelFormatter={value => infrastructureClock(String(value), true)} formatter={(value, name) => [percent(Number(value)), name === 'error4xxRate' ? 'Erros 4xx' : 'Erros 5xx']} contentStyle={{ borderRadius: 12, background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <Line type="linear" dataKey="error4xxRate" className="text-[#b45309] dark:text-orange-300" stroke="currentColor" dot={{ r: 2, fill: 'currentColor', strokeWidth: 0 }} strokeWidth={2} connectNulls={false} isAnimationActive={false} /><Line type="linear" dataKey="error5xxRate" className="text-[#0f766e] dark:text-teal-300" stroke="currentColor" dot={{ r: 2, fill: 'currentColor', strokeWidth: 0 }} strokeWidth={2} connectNulls={false} isAnimationActive={false} />
              </LineChart></ResponsiveContainer></div>
            </CardContent></Card>
          </div>

          <Card className="rounded-3xl border-border/60"><CardHeader className="flex flex-wrap gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-xl font-black">Resumo da entrega</CardTitle><CardDescription className="mt-1">Indicadores calculados sobre as amostras disponíveis.</CardDescription></div><Button variant="outline" className="gap-2 rounded-xl" onClick={exportSnapshot}><Download className="h-4 w-4" aria-hidden="true" />Exportar dados</Button></CardHeader><CardContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric title="Respostas sem erro HTTP" value={percent(summary?.successRate ?? null)} detail="Complemento da taxa de erros; não representa SLA" icon={CheckCircle2} />
              <Metric title="Minutos com amostras" value={`${summary?.sampleCount || 0} / ${minutes}`} detail="Cobertura de dados no período selecionado" icon={Activity} />
              <Metric title="Última amostra no período" value={summary?.latestSample ? infrastructureClock(summary.latestSample) : '—'} detail="Horário de Brasília" icon={Clock3} />
              <Metric title="Intervalo de coleta" value="1 min" detail="Os dados podem chegar com atraso da fonte" icon={RefreshCw} />
            </div>
            <details className="mt-5 rounded-xl border border-border/60 p-3 text-sm"><summary className="cursor-pointer font-semibold">Consultar amostras em tabela</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Amostras disponíveis da distribuição CloudFront</caption><thead><tr>{['Horário', 'Requisições', 'Erros 4xx', 'Erros 5xx'].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead><tbody>{summary?.points.map(point => <tr key={point.timestamp} className="border-t border-border/60"><td className="p-2">{infrastructureClock(point.timestamp)}</td><td className="p-2">{number(point.requests)}</td><td className="p-2">{percent(point.error4xxRate)}</td><td className="p-2">{percent(point.error5xxRate)}</td></tr>)}</tbody></table>{!summary?.points.length && <p className="p-2 text-muted-foreground">Nenhuma amostra disponível neste período.</p>}</div></details>
          </CardContent></Card>
        </>}
        <p className="flex items-start gap-2 rounded-2xl border border-border/60 bg-card/60 p-4 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Escopo: distribuição CloudFront completa. Taxas são ponderadas pelo volume de requisições nos minutos disponíveis. Estes indicadores não medem a saúde individual de APIs, banco de dados ou serviços de origem.</p>
      </main>
    </div>
  </div>
}
