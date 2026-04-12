import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Users,
  UserCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MapPin,
  Heart,
  Smile,
  Brain,
  ArrowRight,
  Activity,
  Target,
  Timer,
  UserX,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { apiFetch, type AdminDashboard } from "@/lib/api"
import { getToken } from "@/lib/auth"
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

  // Check auth immediately on mount
  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate("/admin/login")
      return
    }
    setIsAuthenticated(true)
  }, [navigate])

  // Load dashboard data only if authenticated
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
    __key: `${String(item.stage ?? 'stage')}-${index}`,
  }))
  const regional = (apiData?.regional || []).map((item) => ({
    ...item,
    region: item.region ?? 'Não definida',
    count: Number(item.count ?? 0),
  }))
  const programs = (apiData?.programs || []).map((item) => ({
    ...item,
    count: Number(item.count ?? 0),
  }))
  const alerts = (apiData?.alerts || []).map((item, index) => ({
    id: item.id ?? index + 1,
    type: item.type ?? 'info',
    message: item.message ?? 'Alerta',
  }))
  const insights = (apiData?.insights || []).map((item, index) => ({
    id: item.id ?? index + 1,
    title: item.title ?? 'Insight',
    description: item.description ?? '',
  }))
  const satisfaction = (apiData?.satisfaction || []).map((item) => ({
    ...item,
    score: Number(item.score ?? 0),
  }))

  // Don't render anything until auth check completes
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticacao...</p>
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
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 sm:p-6">
          <div className="space-y-6">
      {/* Page Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground">
            Visão geral do impacto e desempenho da Turma do Bem
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[160px]">
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
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiDefinitions.map((kpi) => {
          const value = kpis[kpi.key as keyof typeof kpis]
          return (
            <Card key={kpi.key} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${kpi.bgColor}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">
                    {value !== undefined ? value.toLocaleString("pt-BR") : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Crescimento</CardTitle>
            <CardDescription>Evolução de atendimentos nos últimos meses</CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <div className="overflow-x-auto">
                <ChartContainer
                  config={{
                    value: { label: "Atendimentos", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px] min-w-[520px]"
                >
                  <AreaChart width={520} height={300} data={trends}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
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
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p>Sem dados de tendência disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regional Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Desempenho Regional</CardTitle>
              <CardDescription>Atendimentos por região</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/regional">
                Ver detalhes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {regional.length > 0 ? (
              <div className="overflow-x-auto">
                <ChartContainer
                  config={{
                    count: { label: "Atendimentos", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px] min-w-[520px]"
                >
                  <BarChart width={520} height={300} data={regional} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="region" className="text-xs" width={110} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p>Sem dados regionais disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Atendimentos</CardTitle>
            <CardDescription>Distribuição atual do pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {pipeline.length > 0 ? (
              <div className="space-y-4">
                {pipeline.map((item, index) => (
                  <div key={item.__key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                      />
                      <span className="text-sm">{item.stage}</span>
                    </div>
                    <span className="font-medium">{(item.count ?? 0).toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>Sem dados de pipeline disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle>Satisfação Geral</CardTitle>
            <CardDescription>NPS e tendência</CardDescription>
          </CardHeader>
          <CardContent>
            {satisfaction.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-center">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-success">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-success">
                        {satisfaction[satisfaction.length - 1]?.score || "-"}
                      </span>
                      <span className="block text-xs text-muted-foreground">NPS Score</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <ChartContainer
                    config={{
                      score: { label: "Satisfação", color: "hsl(var(--chart-3))" },
                    }}
                    className="h-[100px] min-w-[180px]"
                  >
                    <LineChart width={180} height={100} data={satisfaction}>
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
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Sem dados de satisfação</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights Executivos</CardTitle>
            <CardDescription>Métricas chave de desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-background p-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>Sem insights disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Program Performance + Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Programs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Desempenho por Programa</CardTitle>
              <CardDescription>Comparativo entre os programas ativos</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
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
                    <div key={prog.name} className="rounded-lg border border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${definition.color}/10`}>
                            <IconComp className={`h-5 w-5 ${definition.color.replace('bg-', 'text-')}`} />
                          </div>
                          <span className="font-medium">{prog.name}</span>
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
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>Sem dados de programas disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
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
                    className={`flex items-center justify-between rounded-lg p-4 ${
                      alert.type === "alert" || alert.type === "error"
                        ? "bg-destructive/10 border border-destructive/20"
                        : alert.type === "warning"
                        ? "bg-warning/10 border border-warning/20"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.type === "alert" || alert.type === "error"
                            ? "text-destructive"
                            : alert.type === "warning"
                            ? "text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>Nenhum alerta no momento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regional Coverage Map placeholder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Cobertura Geográfica
            </CardTitle>
            <CardDescription>
              Visualização da presença da Turma do Bem no Brasil
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
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
                <div key={region.region} className="rounded-lg border border-border p-4 text-center">
                  <h4 className="font-medium">{region.region}</h4>
                  <p className="text-2xl font-bold text-primary">
                    {(region.count ?? 0).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground">atendimentos</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
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
