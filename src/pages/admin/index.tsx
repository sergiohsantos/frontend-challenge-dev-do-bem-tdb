import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Users,
  UserCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Heart,
  Smile,
  Brain,
  ArrowRight,
  Activity,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { apiFetch, type AdminDashboard } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { getAIRiskDashboard } from "@/services/java-api/ai-risk.service"
import type { AIRiskSummary } from "@/types/java-api"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts"

// KPI definitions (icons and styling only - values come from API)
const kpiDefinitions = [
  {
    key: "totalAppointments",
    title: "Total de Consultas",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "totalPartners",
    title: "Parceiros Ativos",
    icon: Building2,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    key: "totalBeneficiaries",
    title: "Beneficiários",
    icon: Users,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    key: "totalVolunteers",
    title: "Voluntários",
    icon: UserCheck,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  {
    key: "inProgressAppointments",
    title: "Atendimentos em Andamento",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    key: "completedAppointments",
    title: "Atendimentos Concluídos",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
  },
]

const operationalRoutes = [
  { label: "Aprovacoes e laudos", href: "/admin/aprovacoes", hint: "Decidir solicitacoes pendentes antes que a fila cresca." },
  { label: "Triagem", href: "/admin/triagem", hint: "Revisar leads e definir o tipo de atendimento antes do encaminhamento." },
  { label: "Onboarding", href: "/admin/onboarding", hint: "Conferir documentos e habilitar cadastros quando o checklist estiver completo." },
  { label: "Mensagens", href: "/admin/mensagens", hint: "Responder conversas que travam o andamento dos casos." },
  { label: "Indicadores", href: "/admin/relatorios", hint: "Acompanhar relatorios, regioes e satisfacao para decidir proximas acoes." },
]

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

// Program definitions for display
const programDefinitions = [
  { key: "dentistas", name: "Dentistas do Bem", icon: Smile, color: "bg-primary" },
  { key: "apolonias", name: "Apolônias do Bem", icon: Heart, color: "bg-accent" },
  { key: "psicologos", name: "Psicólogos Para o Bem", icon: Brain, color: "bg-success" },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState("30d")
  const [program, setProgram] = useState("all")
  const [region, setRegion] = useState("all")
  const [apiData, setApiData] = useState<AdminDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [aiSummary, setAiSummary] = useState<AIRiskSummary | null>(null)
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null)

  // Check auth immediately on mount
  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate("/admin/login")
      return
    }
    setIsAuthenticated(true)
  }, [navigate])

  // Load dashboard data only if authenticated.
  // Os filtros abaixo ficam prontos para evolução da API. Por segurança, o endpoint atual é mantido sem query params
  // para não quebrar o contrato existente caso o backend ainda não implemente period/program/region.
  useEffect(() => {
    if (!isAuthenticated) return

    const loadDashboard = async () => {
      try {
        const token = getToken()
        if (!token) return

        const data = await apiFetch<AdminDashboard>("/api/admin/dashboard", {}, token)
        setApiData(data)
      } catch (err) {
        console.error("Error loading admin dashboard:", err)
        setError(err instanceof Error ? err.message : "Erro ao carregar dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    const loadAIAlerts = async () => {
      try {
        const response = await getAIRiskDashboard({ days: 14, limit: 20, classification: "all" })
        setAiSummary(response.summary)
        setAiSummaryError(null)
      } catch {
        setAiSummary(null)
        setAiSummaryError("Alertas de IA indisponiveis agora.")
      }
    }

    void loadAIAlerts()
  }, [isAuthenticated])

  // Extract API data with safe defaults and compatibility aliases
  const kpis = apiData?.kpis || {}
  const trends = (apiData?.trends || []).map((item) => ({
    ...item,
    value: Number(item.value ?? 0),
  }))
  const pipeline = (apiData?.pipeline || []).map((item, index) => ({
    ...item,
    stage: item.stage ?? `Etapa ${index + 1}`,
    count: Number(item.count ?? 0),
    __key: `${String(item.stage ?? "stage")}-${index}`,
  }))
  const regional = (apiData?.regional || []).map((item) => ({
    ...item,
    region: item.region ?? "Não definida",
    count: Number(item.count ?? 0),
  }))
  const programs = (apiData?.programs || []).map((item) => ({
    ...item,
    count: Number(item.count ?? 0),
  }))
  const alerts = (apiData?.alerts || []).map((item, index) => ({
    id: item.id ?? index + 1,
    type: item.type ?? "info",
    message: item.message ?? "Alerta",
  }))
  const insights = (apiData?.insights || []).map((item, index) => ({
    id: item.id ?? index + 1,
    title: item.title ?? "Insight",
    description: item.description ?? "",
  }))
  const satisfaction = (apiData?.satisfaction || []).map((item) => ({
    ...item,
    score: Number(item.score ?? 0),
  }))
  const routeStatus = operationalRoutes.map((item) => {
    const label = normalizeText(item.label)
    const relatedAlerts = alerts.filter((alert) => {
      const message = normalizeText(alert.message)
      if (label.includes("aprovacoes")) return message.includes("aprov") || message.includes("laudo")
      if (label.includes("triagem")) return message.includes("triagem") || message.includes("lead")
      if (label.includes("onboarding")) return message.includes("onboarding") || message.includes("document")
      if (label.includes("mensagens")) return message.includes("mensagem") || message.includes("conversa")
      return message.includes("indicador") || message.includes("relatorio") || message.includes("satisfacao")
    })
    return {
      ...item,
      countLabel: relatedAlerts.length > 0 ? `${relatedAlerts.length} alerta(s)` : "Abrir",
      hasAlert: relatedAlerts.length > 0,
    }
  })
  const nextAction =
    routeStatus.find((item) => item.hasAlert) ||
    (pipeline.length > 0 ? routeStatus[1] : null) ||
    (insights.length > 0 ? routeStatus[4] : routeStatus[0])

  // Don't render anything until auth check completes
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main className="overflow-x-hidden p-4 sm:p-6">
          <div className="space-y-6">
            {/* Page Header with Filters */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Dashboard Executivo
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Visão geral do impacto e desempenho da Turma do Bem
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-3 xl:w-auto xl:flex xl:items-center">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-full xl:w-[140px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    <SelectItem value="12m">Últimos 12 meses</SelectItem>
                    <SelectItem value="ytd">Ano atual</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={program} onValueChange={setProgram}>
                  <SelectTrigger className="w-full xl:w-[180px]">
                    <SelectValue placeholder="Programa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os programas</SelectItem>
                    <SelectItem value="dentistas">Dentistas do Bem</SelectItem>
                    <SelectItem value="apolonias">Apolônias do Bem</SelectItem>
                    <SelectItem value="psicologos">Psicólogos Para o Bem</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="w-full xl:w-[160px]">
                    <SelectValue placeholder="Região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as regiões</SelectItem>
                    <SelectItem value="sudeste">Sudeste</SelectItem>
                    <SelectItem value="sul">Sul</SelectItem>
                    <SelectItem value="nordeste">Nordeste</SelectItem>
                    <SelectItem value="centro-oeste">Centro-Oeste</SelectItem>
                    <SelectItem value="norte">Norte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="min-w-0">{error}</span>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {kpiDefinitions.map((kpi) => {
                const value = kpis[kpi.key as keyof typeof kpis]
                return (
                  <Card key={kpi.key} className="min-w-0 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`shrink-0 rounded-lg p-2 ${kpi.bgColor}`}>
                          <kpi.icon className={`h-5 w-5 ${kpi.color}`} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-2xl font-bold leading-tight">
                            {value !== undefined ? value.toLocaleString("pt-BR") : "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">{kpi.title}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Central de Operacao</CardTitle>
                  <CardDescription>Fila de trabalho do Admin com atalhos para decidir, orientar e acompanhar casos.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {routeStatus.map((item) => (
                    <div key={item.href} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.hint}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${item.hasAlert ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                          {item.countLabel}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4 w-full justify-between" asChild>
                        <Link to={item.href}>
                          Abrir area
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="min-w-0 border-primary/20">
                <CardHeader>
                  <CardTitle>Proxima acao recomendada</CardTitle>
                  <CardDescription>Prioridade simples: aprovacoes, triagem, onboarding, mensagens e indicadores.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">Foque agora em</p>
                    <p className="mt-1 text-lg font-semibold">{nextAction.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{nextAction.hint}</p>
                  </div>
                  {alerts.length > 0 ? (
                    <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                      <p className="font-medium">Status do sistema</p>
                      <p className="mt-1 text-muted-foreground">{alerts[0]?.message}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      Nenhum alerta critico no momento. Continue acompanhando a esteira operacional.
                    </div>
                  )}
                  <Button className="w-full justify-between" asChild>
                    <Link to={nextAction.href}>
                      Ir para proxima acao
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Esteira Operacional TDB</CardTitle>
                <CardDescription>Visao simples das etapas retornadas pelo dashboard. Use como leitura de status, sem alterar etapas por aqui.</CardDescription>
              </CardHeader>
              <CardContent>
                {pipeline.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {pipeline.map((item, index) => (
                      <div key={`operational-${item.__key}`} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {index + 1}
                          </span>
                          <p className="min-w-0 truncate font-medium">{item.stage}</p>
                        </div>
                        <p className="text-2xl font-bold">{item.count.toLocaleString("pt-BR")}</p>
                        <p className="text-xs text-muted-foreground">caso(s) nesta etapa</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    A esteira ainda nao retornou etapas. Tente novamente mais tarde ou acompanhe aprovacoes e triagem.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 border-primary/20">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Alertas de IA</CardTitle>
                  <CardDescription>Resumo operacional de risco de falta nas proximas consultas.</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/ia-preditiva">
                    Ver Central de Priorizacao IA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {aiSummary ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Alto risco</p>
                      <p className="text-2xl font-bold text-destructive">{aiSummary.highRisk}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Medio risco</p>
                      <p className="text-2xl font-bold text-warning">{aiSummary.mediumRisk}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Nao confirmados</p>
                      <p className="text-2xl font-bold">{aiSummary.unconfirmed}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Media de risco</p>
                      <p className="text-2xl font-bold">{aiSummary.averageRisk === null ? "-" : `${Math.round(aiSummary.averageRisk * 100)}%`}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    {aiSummaryError || "Carregando alertas de IA..."}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts Row 1 */}
            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
              {/* Trend Chart */}
              <Card className="min-w-0">
                <CardHeader className="space-y-1 p-4 sm:p-6">
                  <CardTitle>Tendência de Crescimento</CardTitle>
                  <CardDescription>Evolução de atendimentos nos últimos meses</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
                  {trends.length > 0 ? (
                    <div className="min-w-0">
                      <ChartContainer
                        config={{
                          value: { label: "Atendimentos", color: "hsl(var(--chart-1))" },
                        }}
                        className="h-[220px] w-full sm:h-[260px] lg:h-[300px]"
                      >
                        <AreaChart data={trends} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 11 }} width={34} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            fill="url(#colorValue)"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted-foreground sm:h-[300px]">
                      <p>Sem dados de tendência disponíveis</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Regional Performance */}
              <Card className="min-w-0">
                <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <CardTitle>Desempenho Regional</CardTitle>
                    <CardDescription>Atendimentos por região</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
                    <Link to="/admin/regional">
                      Ver detalhes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
                  {regional.length > 0 ? (
                    <div className="min-w-0">
                      <ChartContainer
                        config={{
                          count: { label: "Atendimentos", color: "hsl(var(--chart-1))" },
                        }}
                        className="h-[240px] w-full sm:h-[280px] lg:h-[300px]"
                      >
                        <BarChart data={regional} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" className="text-xs" tick={{ fontSize: 11 }} />
                          <YAxis
                            type="category"
                            dataKey="region"
                            className="text-xs"
                            width={90}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) =>
                              String(value).length > 14 ? `${String(value).slice(0, 13)}…` : String(value)
                            }
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted-foreground sm:h-[300px]">
                      <p>Sem dados regionais disponíveis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid min-w-0 gap-6 lg:grid-cols-3">
              {/* Pipeline Status */}
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Status dos Atendimentos</CardTitle>
                  <CardDescription>Distribuição atual do pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  {pipeline.length > 0 ? (
                    <div className="space-y-4">
                      {pipeline.map((item, index) => (
                        <div key={item.__key} className="flex min-w-0 items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                            />
                            <span className="min-w-0 truncate text-sm">{item.stage}</span>
                          </div>
                          <span className="shrink-0 font-medium">{(item.count ?? 0).toLocaleString("pt-BR")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-center text-sm text-muted-foreground">
                      <p>Sem dados de pipeline disponíveis</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Satisfaction */}
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Satisfação Geral</CardTitle>
                  <CardDescription>NPS e tendência</CardDescription>
                </CardHeader>
                <CardContent>
                  {satisfaction.length > 0 ? (
                    <>
                      <div className="mb-4 flex items-center justify-center">
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-success sm:h-32 sm:w-32">
                          <div className="text-center">
                            <span className="text-2xl font-bold text-success sm:text-3xl">
                              {satisfaction[satisfaction.length - 1]?.score || "-"}
                            </span>
                            <span className="block text-xs text-muted-foreground">NPS Score</span>
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <ChartContainer
                          config={{
                            score: { label: "Satisfação", color: "hsl(var(--chart-3))" },
                          }}
                          className="h-[100px] w-full"
                        >
                          <LineChart data={satisfaction} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="hsl(var(--chart-3))"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ChartContainer>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-center text-sm text-muted-foreground">
                      <p>Sem dados de satisfação</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Insights */}
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Insights Executivos</CardTitle>
                  <CardDescription>Métricas chave de desempenho</CardDescription>
                </CardHeader>
                <CardContent>
                  {insights.length > 0 ? (
                    <div className="space-y-4">
                      {insights.map((insight) => (
                        <div key={insight.id} className="flex min-w-0 items-center justify-between rounded-lg bg-muted/50 p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="shrink-0 rounded-lg bg-background p-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{insight.title}</p>
                              <p className="line-clamp-2 text-xs text-muted-foreground">{insight.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-center text-sm text-muted-foreground">
                      <p>Sem insights disponíveis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Program Performance + Alerts */}
            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
              {/* Programs */}
              <Card className="min-w-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle>Desempenho por Programa</CardTitle>
                    <CardDescription>Comparativo entre os programas ativos</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
                    <Link to="/admin/programas">
                      Ver análise completa
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {programs.length > 0 ? (
                    <div className="space-y-4">
                      {programs.map((prog, index) => {
                        const definition = programDefinitions[index] || { icon: Heart, color: "bg-muted" }
                        const IconComp = definition.icon
                        return (
                          <div key={prog.name} className="min-w-0 rounded-lg border border-border p-4">
                            <div className="mb-3 flex min-w-0 items-center justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className={`shrink-0 rounded-lg p-2 ${definition.color}/10`}>
                                  <IconComp className={`h-5 w-5 ${definition.color.replace("bg-", "text-")}`} />
                                </div>
                                <span className="min-w-0 truncate font-medium">{prog.name}</span>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold">{(prog.count ?? 0).toLocaleString("pt-BR")}</p>
                              <p className="text-xs text-muted-foreground">Atendimentos</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-center text-sm text-muted-foreground">
                      <p>Sem dados de programas disponíveis</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Pontos de Atenção
                  </CardTitle>
                  <CardDescription>Alertas que requerem ação da gestão</CardDescription>
                </CardHeader>
                <CardContent>
                  {alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`flex min-w-0 items-start justify-between rounded-lg p-4 ${alert.type === "alert" || alert.type === "error"
                              ? "border border-destructive/20 bg-destructive/10"
                              : alert.type === "warning"
                                ? "border border-warning/20 bg-warning/10"
                                : "bg-muted"
                            }`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <AlertTriangle
                              className={`mt-0.5 h-5 w-5 shrink-0 ${alert.type === "alert" || alert.type === "error"
                                  ? "text-destructive"
                                  : alert.type === "warning"
                                    ? "text-warning"
                                    : "text-muted-foreground"
                                }`}
                            />
                            <p className="min-w-0 text-sm font-medium">{alert.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-center text-sm text-muted-foreground">
                      <p>Nenhum alerta no momento</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Regional Coverage Map placeholder */}
            <Card className="min-w-0">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Cobertura Geográfica
                  </CardTitle>
                  <CardDescription>
                    Visualização da presença da Turma do Bem no Brasil
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
                  <Link to="/admin/regional">
                    Explorar mapa
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {regional.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {regional.map((region) => (
                      <div key={region.region} className="min-w-0 rounded-lg border border-border p-4 text-center">
                        <h4 className="truncate font-medium">{region.region}</h4>
                        <p className="text-2xl font-bold text-primary">
                          {(region.count ?? 0).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">atendimentos</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-center text-sm text-muted-foreground">
                    <p>Sem dados regionais disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
