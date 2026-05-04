import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  Loader2,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
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
import { getAIHealth, getAIModelStatus, getAIReady, predictNoShowRisk } from "@/services/aiApi"
import type { AIHealthResponse, AIModelStatusResponse, AIReadyResponse, PredictRequest, PredictResponse } from "@/types/ai"

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

const futureCards = [
  "Faltas por periodo",
  "Risco medio por regiao",
  "Beneficiarios com maior prioridade",
  "Especialidades com maior risco",
  "Efetividade de lembretes",
  "Evolucao do modelo com dados reais",
]

const processCards = [
  {
    title: "Identifica risco",
    text: "O modelo analisa dados de agendamento, historico e comunicacao.",
    icon: Radar,
  },
  {
    title: "Prioriza acao",
    text: "Beneficiarios com maior risco podem receber atencao antecipada.",
    icon: Target,
  },
  {
    title: "Apoia contato",
    text: "A recomendacao pode orientar lembretes, WhatsApp e acompanhamento do admin.",
    icon: MessageCircle,
  },
]

function formatPercent(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-"
  return `${Math.round(value * 100)}%`
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

function sourceLabel(value?: string): string {
  if (!value) return "Nao informado"
  if (value === "database") return "database"
  if (value === "api") return "api"
  if (value === "csv") return "csv"
  return value
}

function riskPalette(classificacao?: string) {
  const normalized = classificacao?.toUpperCase()
  if (normalized === "ALTO") {
    return {
      card: "border-destructive/30 bg-destructive/5",
      badge: "bg-destructive text-destructive-foreground",
      bar: "bg-destructive",
      text: "text-destructive",
    }
  }
  if (normalized === "MEDIO" || normalized === "MÉDIO") {
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

export default function AdminIAPreditivaPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [health, setHealth] = useState<AIHealthResponse | null>(null)
  const [ready, setReady] = useState<AIReadyResponse | null>(null)
  const [modelStatus, setModelStatus] = useState<AIModelStatusResponse | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [form, setForm] = useState<PredictRequest>(INITIAL_FORM)
  const [prediction, setPrediction] = useState<PredictResponse | null>(null)
  const [isStatusLoading, setIsStatusLoading] = useState(true)
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

  useEffect(() => {
    void loadAIStatus()
  }, [])

  const metadata = modelStatus?.metadata
  const metrics = metadata?.metrics
  const isApiOnline = health?.status === "ok"
  const isModelLoaded = Boolean(ready?.model_loaded || modelStatus?.model_loaded)
  const dataSource = sourceLabel(ready?.data_source || metadata?.data_source)
  const rowsUsed = ready?.rows_used ?? metadata?.rows_used

  const metricCards = useMemo(() => [
    { label: "Modelo selecionado", value: ready?.selected_model || metadata?.selected_model || "-", hint: "Algoritmo publicado na API." },
    { label: "Treinamento", value: formatDateTime(ready?.trained_at || metadata?.trained_at), hint: "Data/hora da versao em uso." },
    { label: "Acuracia geral", value: formatPercent(metrics?.accuracy), hint: "Acertos gerais do modelo." },
    { label: "Precisao em risco", value: formatPercent(metrics?.precision_classe_1), hint: "Quando marca risco, indica a confianca desse alerta." },
    { label: "Captura de faltas", value: formatPercent(metrics?.recall_classe_1), hint: "Quanto o modelo consegue capturar da classe de risco." },
    { label: "Equilibrio", value: formatPercent(metrics?.f1_classe_1), hint: "Balanceia precisao e recall." },
    { label: "Separacao do modelo", value: formatPercent(metrics?.roc_auc), hint: "Capacidade de separar baixo e alto risco." },
  ], [metadata, metrics, ready])

  function updateTextField(field: keyof PredictRequest, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateNumberField(field: keyof PredictRequest, value: string) {
    const parsed = Number(value)
    setForm((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }))
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

  const riskPercent = Math.round((prediction?.risco_nao_comparecimento || 0) * 100)
  const palette = riskPalette(prediction?.classificacao)

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <AdminHeader />

        <main className="flex-1 space-y-6 p-4 sm:p-6">
          <section className="overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={isApiOnline ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                    {isApiOnline ? "API Online" : "API Indisponivel"}
                  </Badge>
                  <Badge className={isModelLoaded ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                    {isModelLoaded ? "Modelo Carregado" : "Modelo Nao Carregado"}
                  </Badge>
                  <Badge variant="outline">Sprint 4 Chatbot IA</Badge>
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                    Analise Preditiva com IA
                  </h1>
                  <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                    Previsao de risco de nao comparecimento e apoio a decisao operacional
                  </p>
                </div>

                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  A IA estima o risco de nao comparecimento em atendimentos, apoiando o administrador na priorizacao de contatos, lembretes e acoes preventivas.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">API independente</p>
                    <p className="mt-1 text-sm text-foreground">Consumida pelo frontend, Python ou Java.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Decisao preventiva</p>
                    <p className="mt-1 text-sm text-foreground">Prioriza contato, WhatsApp e acompanhamento.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Pronta para evoluir</p>
                    <p className="mt-1 text-sm text-foreground">Pipeline funcional para dados reais do banco.</p>
                  </div>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Observabilidade da IA
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    Status consultado em tempo real na API publicada.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-primary-foreground/10 p-3">
                    <span className="text-sm">Servico</span>
                    <span className="font-semibold">{health?.service || "tdb-ai-sprint4"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary-foreground/10 p-3">
                    <span className="text-sm">Fonte atual</span>
                    <span className="font-semibold">{dataSource}</span>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={() => void loadAIStatus()} disabled={isStatusLoading}>
                    {isStatusLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                    Atualizar indicadores
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

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
              ? "Fonte academica atual. Estrutura preparada para evolucao com dados reais do banco."
              : dataSource === "database"
                ? "Fonte integrada ao banco de dados."
                : "Fonte atual informada pela API. A tela exibe a origem retornada sem simular banco real."}
          </div>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Metricas do modelo</h2>
              <p className="text-sm text-muted-foreground">
                Para este caso de uso, o recall da classe de risco e relevante porque ajuda a identificar beneficiarios que podem precisar de contato preventivo.
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

          <section className="grid gap-4 lg:grid-cols-3">
            {processCards.map((item) => (
              <Card key={item.title} className="border-primary/10 shadow-sm">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Simular previsao
                </CardTitle>
                <CardDescription>
                  Preencha os dados do atendimento para estimar o risco de nao comparecimento.
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

            <Card className={`shadow-sm ${prediction ? palette.card : "border-primary/10"}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Resultado da predicao
                </CardTitle>
                <CardDescription>
                  O resultado abaixo vem do POST /predict da API real.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {prediction ? (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Risco estimado</p>
                      <p className={`mt-1 text-5xl font-bold ${palette.text}`}>{riskPercent}%</p>
                      <Badge className={`mt-3 ${palette.badge}`}>Classificacao: {prediction.classificacao}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="h-3 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${Math.min(riskPercent, 100)}%` }} />
                      </div>
                      <Progress value={riskPercent} className="sr-only" />
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-sm font-semibold text-foreground">Recomendacao operacional</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{prediction.recomendacao}</p>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      A predicao apoia decisoes preventivas, como priorizacao de contato, lembrete via WhatsApp e acompanhamento pelo administrador.
                    </p>
                  </>
                ) : (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                    <Clock3 className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 font-medium text-foreground">Aguardando simulacao</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Execute uma previsao para visualizar risco, classificacao e recomendacao operacional.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="max-w-4xl">
              <h2 className="text-xl font-bold text-foreground">Preparado para evolucao com dados reais</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A arquitetura ja permite alternar a fonte de dados da IA entre CSV academico, API interna e banco de dados. A medida que o historico real de agendamentos, faltas, remarcacoes, confirmacoes e mensagens for populado, o painel podera apresentar metricas mais robustas e apoiar decisoes operacionais com maior precisao.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A versao atual demonstra o pipeline funcional da Sprint 4. A arquitetura esta pronta para evoluir com dados reais do banco conforme o historico operacional for populado.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {futureCards.map((title) => (
                <div key={title} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Aguardando historico real.</p>
                    </div>
                    <Badge variant="outline">Em preparacao</Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
