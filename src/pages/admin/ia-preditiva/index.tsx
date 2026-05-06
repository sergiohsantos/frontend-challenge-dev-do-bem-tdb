import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  Gauge,
  Loader2,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAIHealth, getAIModelStatus, getAIReady, predictNoShowRisk } from "@/services/aiApi"
import { getAIReminderPreview, getAIRiskDashboard } from "@/services/java-api/ai-risk.service"
import type { AIHealthResponse, AIModelStatusResponse, AIReadyResponse, PredictRequest, PredictResponse } from "@/types/ai"
import type { AIReminderPreviewResponse, AIRiskDashboardParams, AIRiskDashboardResponse, AIRiskItem } from "@/types/java-api"

const INITIAL_FORM: PredictRequest = {
  idade: 15,
  programa: "Dentista do Bem",
  regiao: "Zona Sul",
  tipo_procedimento: "Tratamento odontologico",
  especialidade: "Odontologia",
  urgencia_clinica: 4,
  dias_ate_consulta: 3,
  faltas_anteriores: 1,
  qtd_remarcacoes: 2,
  tempo_medio_resposta_horas: 26,
  canal_preferido: "WhatsApp",
  lembretes_enviados: 1,
  documentos_pendentes: 1,
  status_aprovacao: "Aprovado",
  carga_voluntario: 18,
}

const INITIAL_FILTERS: AIRiskDashboardParams = {
  days: 14,
  limit: 50,
  classification: "all",
  program: "all",
  region: "all",
}

function formatPercent(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-"
  return `${Math.round(value * 100)}%`
}

function formatDate(value?: string | null): string {
  if (!value) return "-"
  const parts = value.split("-")
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return value
}

function formatTime(value?: string | null): string {
  if (!value) return "-"
  return value.slice(0, 5)
}

function formatDateTime(value?: string): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function sourceLabel(value?: string | null): string {
  if (!value) return "Nao informado"
  return value
}

function riskPalette(classification?: string | null) {
  const normalized = classification?.toUpperCase()
  if (normalized === "ALTO") {
    return {
      card: "border-destructive/30 bg-destructive/5",
      badge: "bg-destructive text-destructive-foreground",
      bar: "bg-destructive",
      text: "text-destructive",
    }
  }
  if (normalized === "MEDIO" || normalized === "MEDIO") {
    return {
      card: "border-warning/40 bg-warning/10",
      badge: "bg-warning text-warning-foreground",
      bar: "bg-warning",
      text: "text-warning",
    }
  }
  return {
    card: "border-success/30 bg-success/5",
    badge: "bg-success text-success-foreground",
    bar: "bg-success",
    text: "text-success",
  }
}

function safeItems(response: AIRiskDashboardResponse | null): AIRiskItem[] {
  return Array.isArray(response?.items) ? response.items : []
}

function statValue(value?: number | null): string {
  if (value === null || value === undefined) return "-"
  return value.toLocaleString("pt-BR")
}

export default function AdminIAPreditivaPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [health, setHealth] = useState<AIHealthResponse | null>(null)
  const [ready, setReady] = useState<AIReadyResponse | null>(null)
  const [modelStatus, setModelStatus] = useState<AIModelStatusResponse | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<AIRiskDashboardResponse | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AIRiskDashboardParams>(INITIAL_FILTERS)
  const [reminderPreview, setReminderPreview] = useState<AIReminderPreviewResponse | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null)
  const [form, setForm] = useState<PredictRequest>(INITIAL_FORM)
  const [prediction, setPrediction] = useState<PredictResponse | null>(null)
  const [isStatusLoading, setIsStatusLoading] = useState(true)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictError, setPredictError] = useState<string | null>(null)

  async function loadAIStatus() {
    setIsStatusLoading(true)
    setStatusError(null)

    const [healthResult, readyResult, modelResult] = await Promise.allSettled([
      getAIHealth(),
      getAIReady(),
      getAIModelStatus(),
    ])

    setHealth(healthResult.status === "fulfilled" ? healthResult.value : null)
    setReady(readyResult.status === "fulfilled" ? readyResult.value : null)
    setModelStatus(modelResult.status === "fulfilled" ? modelResult.value : null)

    if (healthResult.status === "rejected" || readyResult.status === "rejected" || modelResult.status === "rejected") {
      setStatusError("Alguns indicadores da API de IA nao puderam ser carregados agora.")
    }

    setIsStatusLoading(false)
  }

  async function loadDashboard(nextFilters: AIRiskDashboardParams = filters) {
    setIsDashboardLoading(true)
    setDashboardError(null)

    try {
      const response = await getAIRiskDashboard(nextFilters)
      setDashboard(response)
    } catch (error) {
      setDashboard(null)
      setDashboardError(error instanceof Error ? error.message : "Nao foi possivel carregar a fila operacional de IA.")
    } finally {
      setIsDashboardLoading(false)
    }
  }

  useEffect(() => {
    void loadAIStatus()
    void loadDashboard(INITIAL_FILTERS)
  }, [])

  const metadata = modelStatus?.metadata
  const metrics = metadata?.metrics
  const summary = dashboard?.summary
  const items = safeItems(dashboard)
  const warnings = dashboard?.warnings || []
  const isApiOnline = health?.status === "ok"
  const isModelLoaded = Boolean(ready?.model_loaded || modelStatus?.model_loaded)
  const dataSource = sourceLabel(ready?.data_source || metadata?.data_source || summary?.modelSource)
  const rowsUsed = ready?.rows_used ?? metadata?.rows_used

  const metricCards = useMemo(() => [
    { label: "Modelo selecionado", value: ready?.selected_model || metadata?.selected_model || "-", hint: "Algoritmo publicado na API." },
    { label: "Treinamento", value: formatDateTime(ready?.trained_at || metadata?.trained_at), hint: "Data/hora da versao em uso." },
    { label: "Acuracia geral", value: formatPercent(metrics?.accuracy), hint: "Acertos gerais do modelo." },
    { label: "Precisao em risco", value: formatPercent(metrics?.precision_classe_1), hint: "Quando marca risco, indica a confianca desse alerta." },
    { label: "Captura de faltas", value: formatPercent(metrics?.recall_classe_1), hint: "Quanto o modelo captura da classe de risco." },
    { label: "Equilibrio", value: formatPercent(metrics?.f1_classe_1), hint: "Balanceia precisao e recall." },
    { label: "Separacao", value: formatPercent(metrics?.roc_auc), hint: "Capacidade de separar baixo e alto risco." },
  ], [metadata, metrics, ready])

  function updateTextField(field: keyof PredictRequest, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateNumberField(field: keyof PredictRequest, value: string) {
    const parsed = Number(value)
    setForm((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }))
  }

  function updateFilter<K extends keyof AIRiskDashboardParams>(field: K, value: AIRiskDashboardParams[K]) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  async function handlePredict() {
    try {
      setIsPredicting(true)
      setPredictError(null)
      const result = await predictNoShowRisk(form)
      setPrediction(result)
    } catch {
      setPredictError("Nao foi possivel executar a predicao. Verifique se o servico de IA esta pronto.")
    } finally {
      setIsPredicting(false)
    }
  }

  async function handleReminderPreview(appointmentId: number) {
    try {
      setPreviewLoadingId(appointmentId)
      const response = await getAIReminderPreview(appointmentId)
      setReminderPreview(response)
    } catch (error) {
      setReminderPreview({
        appointmentId,
        channel: "whatsapp",
        message: error instanceof Error ? error.message : "Nao foi possivel gerar a pre-visualizacao agora.",
      })
    } finally {
      setPreviewLoadingId(null)
    }
  }

  const riskPercent = Math.round((prediction?.risco_nao_comparecimento || 0) * 100)
  const predictionPalette = riskPalette(prediction?.classificacao)

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <AdminHeader />

        <main className="flex-1 space-y-6 p-4 sm:p-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={summary?.aiAvailable ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                    {summary?.aiAvailable ? "IA operacional disponivel" : "IA operacional em fallback"}
                  </Badge>
                  <Badge variant="outline">Java orquestrador</Badge>
                  <Badge variant="outline">FastAPI preservada</Badge>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Central de Priorizacao IA</h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                    Fila operacional de consultas com dados reais do banco, enriquecidas pelo Java e preditas pela API de IA.
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={() => { void loadDashboard(filters); void loadAIStatus() }} disabled={isDashboardLoading || isStatusLoading}>
                {(isDashboardLoading || isStatusLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Atualizar
              </Button>
            </div>
          </section>

          <Tabs defaultValue="fila" className="space-y-5">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3 lg:w-[720px]">
              <TabsTrigger value="fila" className="gap-2"><Users className="h-4 w-4" />Fila de Prioridade</TabsTrigger>
              <TabsTrigger value="simulacao" className="gap-2"><Gauge className="h-4 w-4" />Simulacao Tecnica</TabsTrigger>
              <TabsTrigger value="modelo" className="gap-2"><Brain className="h-4 w-4" />Modelo e Evidencias</TabsTrigger>
            </TabsList>

            <TabsContent value="fila" className="space-y-5">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: "Total analisado", value: statValue(summary?.totalAnalyzed), icon: BarChart3 },
                  { title: "Alto risco", value: statValue(summary?.highRisk), icon: AlertTriangle },
                  { title: "Medio risco", value: statValue(summary?.mediumRisk), icon: TrendingUp },
                  { title: "Baixo risco", value: statValue(summary?.lowRisk), icon: CheckCircle2 },
                  { title: "Media de risco", value: formatPercent(summary?.averageRisk), icon: Activity },
                  { title: "Nao confirmados", value: statValue(summary?.unconfirmed), icon: Clock3 },
                  { title: "Janela", value: `${summary?.nextDays ?? filters.days} dias`, icon: CalendarClock },
                  { title: "Fonte do modelo", value: dataSource, icon: Database },
                ].map((item) => (
                  <Card key={item.title} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        {isDashboardLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">{item.title}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <Card className="shadow-sm">
                <CardContent className="grid gap-4 p-4 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Periodo</Label>
                    <Select value={String(filters.days || 14)} onValueChange={(value) => updateFilter("days", Number(value))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="14">14 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Classificacao</Label>
                    <Select value={filters.classification || "all"} onValueChange={(value) => updateFilter("classification", value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="ALTO">Alto</SelectItem>
                        <SelectItem value="MEDIO">Medio</SelectItem>
                        <SelectItem value="BAIXO">Baixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-filter">Programa</Label>
                    <Input id="program-filter" value={filters.program === "all" ? "" : filters.program || ""} onChange={(event) => updateFilter("program", event.target.value || "all")} placeholder="Todos" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region-filter">Regiao</Label>
                    <Input id="region-filter" value={filters.region === "all" ? "" : filters.region || ""} onChange={(event) => updateFilter("region", event.target.value || "all")} placeholder="Todas" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={() => void loadDashboard(filters)} disabled={isDashboardLoading}>
                      {isDashboardLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                      Aplicar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {warnings.map((warning) => (
                <div key={warning} className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  {warning}
                </div>
              ))}

              {dashboardError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {dashboardError}
                </div>
              )}

              {reminderPreview && (
                <Card className="border-primary/20 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      Pre-visualizacao de lembrete
                    </CardTitle>
                    <CardDescription>Este endpoint apenas sugere a mensagem. O Java nao envia WhatsApp nesta etapa.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-foreground">{reminderPreview.message}</p>
                  </CardContent>
                </Card>
              )}

              <section className="space-y-4">
                {isDashboardLoading && !items.length ? (
                  <Card className="shadow-sm">
                    <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="mt-3 font-medium text-foreground">Carregando fila operacional</p>
                    </CardContent>
                  </Card>
                ) : null}

                {!isDashboardLoading && !items.length && !dashboardError ? (
                  <Card className="shadow-sm">
                    <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
                      <CheckCircle2 className="h-10 w-10 text-success" />
                      <p className="mt-4 font-medium text-foreground">Nenhuma consulta na fila</p>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Nao ha consultas futuras com os filtros atuais ou ainda nao existem dados reais suficientes para priorizacao.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                {items.map((item) => {
                  const palette = riskPalette(item.classification)
                  const risk = item.risk !== null && item.risk !== undefined ? Math.round(item.risk * 100) : null

                  return (
                    <Card key={item.appointmentId} className={`shadow-sm ${palette.card}`}>
                      <CardContent className="space-y-4 p-4 sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={palette.badge}>{item.classification || "Sem predicao"}</Badge>
                              <Badge variant="outline">{item.appointmentStatus || "Status nao informado"}</Badge>
                              {!item.confirmed ? <Badge variant="outline">Nao confirmado</Badge> : null}
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-foreground">{item.beneficiaryName}</h2>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(item.appointmentDate)} as {formatTime(item.appointmentTime)} · {item.programa || "Programa nao informado"}
                              </p>
                            </div>
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="text-sm text-muted-foreground">Risco estimado</p>
                            <p className={`text-3xl font-bold ${palette.text}`}>{risk === null ? "-" : `${risk}%`}</p>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-lg border border-border bg-background/70 p-3">
                            <p className="text-xs uppercase text-muted-foreground">Voluntario</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{item.volunteerName || "Nao vinculado"}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-background/70 p-3">
                            <p className="text-xs uppercase text-muted-foreground">Regiao</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{item.regiao || "-"}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-background/70 p-3">
                            <p className="text-xs uppercase text-muted-foreground">Procedimento</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{item.procedureTitle || "-"}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-background/70 p-3">
                            <p className="text-xs uppercase text-muted-foreground">Solicitacao</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{item.approvalRequestId || "-"}</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-border bg-background/70 p-3">
                          <p className="text-sm font-semibold text-foreground">Motivos operacionais</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.reasons.map((reason) => (
                              <Badge key={reason} variant="outline">{reason}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-border bg-background/70 p-3">
                          <p className="text-sm font-semibold text-foreground">Recomendacao</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.recommendation || "Acompanhar o caso na fila operacional."}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/admin/beneficiarios/${item.beneficiaryId}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver beneficiario
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href="/admin/mensagens">
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Abrir mensagens
                            </a>
                          </Button>
                          <Button size="sm" onClick={() => void handleReminderPreview(item.appointmentId)} disabled={previewLoadingId === item.appointmentId}>
                            {previewLoadingId === item.appointmentId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Pre-visualizar lembrete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </section>
            </TabsContent>

            <TabsContent value="simulacao" className="space-y-5">
              <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-primary" />
                      Simular previsao tecnica
                    </CardTitle>
                    <CardDescription>
                      Formulario mantido para chamar diretamente o POST /predict da FastAPI de IA.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="idade">Idade</Label>
                        <Input id="idade" type="number" value={form.idade} onChange={(event) => updateNumberField("idade", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Programa</Label>
                        <Select value={form.programa} onValueChange={(value) => updateTextField("programa", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dentista do Bem">Dentista do Bem</SelectItem>
                            <SelectItem value="Apolonias do Bem">Apolonias do Bem</SelectItem>
                            <SelectItem value="Psicologos para o Bem">Psicologos para o Bem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regiao">Regiao</Label>
                        <Input id="regiao" value={form.regiao} onChange={(event) => updateTextField("regiao", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tipo-procedimento">Tipo de procedimento</Label>
                        <Input id="tipo-procedimento" value={form.tipo_procedimento} onChange={(event) => updateTextField("tipo_procedimento", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="especialidade">Especialidade</Label>
                        <Input id="especialidade" value={form.especialidade} onChange={(event) => updateTextField("especialidade", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="urgencia">Urgencia clinica</Label>
                        <Input id="urgencia" type="number" min={1} max={5} value={form.urgencia_clinica} onChange={(event) => updateNumberField("urgencia_clinica", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dias-consulta">Dias ate consulta</Label>
                        <Input id="dias-consulta" type="number" value={form.dias_ate_consulta} onChange={(event) => updateNumberField("dias_ate_consulta", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="faltas">Faltas anteriores</Label>
                        <Input id="faltas" type="number" value={form.faltas_anteriores} onChange={(event) => updateNumberField("faltas_anteriores", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remarcacoes">Remarcacoes</Label>
                        <Input id="remarcacoes" type="number" value={form.qtd_remarcacoes} onChange={(event) => updateNumberField("qtd_remarcacoes", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tempo-resposta">Tempo medio resposta (h)</Label>
                        <Input id="tempo-resposta" type="number" value={form.tempo_medio_resposta_horas} onChange={(event) => updateNumberField("tempo_medio_resposta_horas", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Canal preferido</Label>
                        <Select value={form.canal_preferido} onValueChange={(value) => updateTextField("canal_preferido", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Telefone">Telefone</SelectItem>
                            <SelectItem value="E-mail">E-mail</SelectItem>
                            <SelectItem value="SMS">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lembretes">Lembretes enviados</Label>
                        <Input id="lembretes" type="number" value={form.lembretes_enviados} onChange={(event) => updateNumberField("lembretes_enviados", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Documentos pendentes</Label>
                        <Select value={String(form.documentos_pendentes)} onValueChange={(value) => updateNumberField("documentos_pendentes", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Nao</SelectItem>
                            <SelectItem value="1">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status aprovacao</Label>
                        <Select value={form.status_aprovacao} onValueChange={(value) => updateTextField("status_aprovacao", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aprovado">Aprovado</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Em analise">Em analise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="carga-voluntario">Carga voluntario</Label>
                        <Input id="carga-voluntario" type="number" value={form.carga_voluntario} onChange={(event) => updateNumberField("carga_voluntario", event.target.value)} />
                      </div>
                    </div>

                    {predictError && (
                      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {predictError}
                      </div>
                    )}

                    <Button className="w-full sm:w-auto" onClick={() => void handlePredict()} disabled={isPredicting}>
                      {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isPredicting ? "Analisando risco..." : "Calcular risco"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className={`shadow-sm ${prediction ? predictionPalette.card : "border-primary/10"}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Resultado da predicao
                    </CardTitle>
                    <CardDescription>Resultado vindo diretamente do POST /predict da FastAPI IA.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {prediction ? (
                      <>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Risco estimado</p>
                          <p className={`mt-1 text-5xl font-bold ${predictionPalette.text}`}>{riskPercent}%</p>
                          <Badge className={`mt-3 ${predictionPalette.badge}`}>Classificacao: {prediction.classificacao}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full rounded-full ${predictionPalette.bar}`} style={{ width: `${Math.min(riskPercent, 100)}%` }} />
                          </div>
                          <Progress value={riskPercent} className="sr-only" />
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4">
                          <p className="text-sm font-semibold text-foreground">Recomendacao operacional</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{prediction.recomendacao}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                        <Clock3 className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 font-medium text-foreground">Aguardando simulacao</p>
                        <p className="mt-2 text-sm text-muted-foreground">Execute uma previsao para visualizar risco, classificacao e recomendacao.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="modelo" className="space-y-5">
              {statusError && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  {statusError}
                </div>
              )}

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: "API de IA", value: isApiOnline ? "Online" : "Indisponivel", source: "GET /health", icon: Activity },
                  { title: "Modelo", value: isModelLoaded ? "Carregado" : "Nao carregado", source: "GET /ready", icon: ShieldCheck },
                  { title: "Fonte atual", value: dataSource, source: "GET /ready ou /model/status", icon: Database },
                  { title: "Registros usados", value: rowsUsed !== undefined ? rowsUsed.toLocaleString("pt-BR") : "-", source: "GET /ready ou /model/status", icon: BarChart3 },
                ].map((item) => (
                  <Card key={item.title} className="border-border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        {isStatusLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">{item.title}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{item.value}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Fonte: {item.source}</p>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <div className="rounded-lg border border-accent/20 bg-accent/10 p-4 text-sm text-accent-foreground">
                {dataSource === "csv"
                  ? "Fonte academica atual retornada pela API. Esta tela nao afirma treinamento com banco real enquanto /model/status informar data_source=csv."
                  : dataSource === "database"
                    ? "Fonte integrada ao banco de dados conforme informada pela API."
                    : "Fonte atual exibida exatamente como retornada pela API de IA."}
              </div>

              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Metricas do modelo</h2>
                  <p className="text-sm text-muted-foreground">
                    Indicadores retornados pela FastAPI IA. Os motivos da fila operacional sao regras deterministicas do Java.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                  {metricCards.map((metric) => (
                    <Card key={metric.label} className="shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{metric.label}</p>
                        <p className="mt-2 text-xl font-bold text-foreground">{metric.value}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{metric.hint}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
