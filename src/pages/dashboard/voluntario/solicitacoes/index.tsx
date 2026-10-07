import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerPageHero } from "@/components/dashboard/volunteer-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  FilePlus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Loader2,
  AlertCircle,
  User,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { apiFetch, type ProcedureRequest } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  em_analise: { label: "Em análise", color: "bg-primary/10 text-primary border-primary/30", icon: Clock },
  aprovado: { label: "Aprovado", color: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
  rejeitado: { label: "Rejeitado", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
  info_adicional: { label: "Info solicitada", color: "bg-accent/10 text-accent border-accent/30", icon: AlertTriangle },
}

const prioridadeMap: Record<string, { label: string; color: string }> = {
  urgente: { label: "Urgente", color: "bg-destructive text-destructive-foreground" },
  alta: { label: "Alta", color: "bg-accent text-accent-foreground" },
  normal: { label: "Normal", color: "bg-muted text-muted-foreground" },
}

export default function SolicitacoesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<ProcedureRequest[]>([])
  const [userName, setUserName] = useState("...")

  useEffect(() => {
    const user = getUser()
    if (user?.full_name) setUserName(user.full_name)
  }, [])

  const loadRequests = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true)
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const data = await apiFetch<ProcedureRequest[]>("/api/volunteers/procedure-requests", {}, token)
      setRequests(data || [])
      setError(null)
    } catch {
      setError("Não foi possível carregar suas solicitações agora. Tente novamente em instantes.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests(true)
    const interval = window.setInterval(() => loadRequests(false), 7000)
    return () => window.clearInterval(interval)
  }, [navigate])

  const filteredRequests = requests.filter((r) =>
    r.beneficiario.toLowerCase().includes(search.toLowerCase()) ||
    r.procedimento.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  )

  const pendingRequests = filteredRequests.filter(r => ["pendente", "em_analise", "info_adicional"].includes(r.status))
  const approvedRequests = filteredRequests.filter(r => r.status === "aprovado")
  const rejectedRequests = filteredRequests.filter(r => r.status === "rejeitado")
  const actionRequiredRequests = filteredRequests.filter(r => r.status === "info_adicional")

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName="..." userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando solicitações...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <VolunteerPageHero
            eyebrow="Solicitações"
            title="Acompanhe procedimentos solicitados para seus casos."
            description="Revise status, respostas da equipe TDB e pendências de informação sem perder o contexto do beneficiário."
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            primaryAction={(
              <Button size="lg" asChild className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90">
                <Link to="/dashboard/voluntario/solicitacoes/nova">
                  <FilePlus className="mr-2 h-5 w-5" />
                  Nova solicitação
                </Link>
              </Button>
            )}
            meta={(
              <>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{requests.length} total</span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{pendingRequests.length} em andamento</span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{actionRequiredRequests.length} com ação necessária</span>
              </>
            )}
          />

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <SummaryCard title="Pendentes" value={pendingRequests.length} icon={Clock} tone="warning" />
            <SummaryCard title="Aprovadas" value={approvedRequests.length} icon={ShieldCheck} tone="success" />
            <SummaryCard title="Em ajuste" value={actionRequiredRequests.length} icon={AlertTriangle} tone="accent" />
            <SummaryCard title="Rejeitadas" value={rejectedRequests.length} icon={XCircle} tone="danger" />
          </div>

          {actionRequiredRequests.length > 0 && (
            <Card className="tdb-polished-card mb-6 rounded-[2rem] border-accent/40 bg-accent/10">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent"><AlertTriangle className="h-5 w-5" /></div>
                  <div>
                    <p className="font-black text-foreground">Há solicitações que precisam de resposta</p>
                    <p className="text-sm leading-6 text-muted-foreground">Revise os comentários da equipe TDB e envie as informações solicitadas.</p>
                  </div>
                </div>
                <Button variant="outline" asChild className="h-10 rounded-full px-4 font-bold sm:w-auto">
                  <Link to={`/dashboard/voluntario/solicitacoes/${actionRequiredRequests[0].public_id || actionRequiredRequests[0].id}`}>Responder primeira</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="tdb-polished-card mb-6 rounded-[2rem]">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por beneficiário, procedimento ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-full pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pendentes" className="space-y-4">
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-muted p-1 sm:w-fit">
              <TabsTrigger value="pendentes" className="gap-2 rounded-full">
                <Clock className="h-4 w-4" />Pendentes<Badge variant="secondary" className="ml-1 rounded-full">{pendingRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="aprovados" className="gap-2 rounded-full">
                <CheckCircle2 className="h-4 w-4" />Aprovados<Badge variant="secondary" className="ml-1 rounded-full">{approvedRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejeitados" className="gap-2 rounded-full">
                <XCircle className="h-4 w-4" />Rejeitados<Badge variant="secondary" className="ml-1 rounded-full">{rejectedRequests.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes" className="space-y-4">
              {pendingRequests.length > 0 ? pendingRequests.map((request) => <RequestCard key={request.id} request={request} />) : <EmptyRequests icon={<FileText className="h-10 w-10" />} text="Nenhuma solicitação pendente" />}
            </TabsContent>
            <TabsContent value="aprovados" className="space-y-4">
              {approvedRequests.length > 0 ? approvedRequests.map((request) => <RequestCard key={request.id} request={request} />) : <EmptyRequests icon={<CheckCircle2 className="h-10 w-10" />} text="Nenhuma solicitação aprovada" />}
            </TabsContent>
            <TabsContent value="rejeitados" className="space-y-4">
              {rejectedRequests.length > 0 ? rejectedRequests.map((request) => <RequestCard key={request.id} request={request} />) : <EmptyRequests icon={<XCircle className="h-10 w-10" />} text="Nenhuma solicitação rejeitada" />}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}

function EmptyRequests({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Card className="tdb-polished-card rounded-[2rem]">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-muted-foreground/40">{icon}</div>
        <p className="font-semibold text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}

function RequestCard({ request }: { request: ProcedureRequest }) {
  const status = statusMap[request.status] || statusMap.pendente
  const prioridade = prioridadeMap[request.prioridade] || prioridadeMap.normal
  const StatusIcon = status.icon

  return (
    <Card className="tdb-polished-card rounded-[2rem] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">{request.public_id || request.id}</Badge>
              <Badge className={`rounded-full ${prioridade.color}`}>{prioridade.label}</Badge>
              <Badge variant="outline" className={`rounded-full ${status.color}`}>
                <StatusIcon className="mr-1 h-3 w-3" />{status.label}
              </Badge>
            </div>

            <div>
              <h3 className="text-xl font-black text-foreground">{request.procedimento}</h3>
              {request.justificativa && <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{request.justificativa}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>{request.beneficiario}</span></div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{request.dataSolicitacao ? new Date(request.dataSolicitacao).toLocaleDateString("pt-BR") : "-"}</span></div>
            </div>

            {request.adminComments && request.adminComments.length > 0 && (
              <div className="mt-4 rounded-2xl bg-muted p-4">
                <p className="mb-1 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Última mensagem da equipe TDB</p>
                <p className="text-sm leading-6 text-foreground">{request.adminComments[request.adminComments.length - 1].content}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:ml-6 lg:w-44 lg:flex-col">
            <Button variant="outline" size="sm" asChild className="h-10 w-full rounded-full font-bold">
              <Link to={`/dashboard/voluntario/solicitacoes/${request.public_id || request.id}`}><Eye className="mr-2 h-4 w-4" />Ver detalhes</Link>
            </Button>
            {request.status === "info_adicional" && (
              <Button size="sm" asChild className="h-10 w-full rounded-full font-bold">
                <Link to={`/dashboard/voluntario/solicitacoes/${request.public_id || request.id}`}><MessageSquare className="mr-2 h-4 w-4" />Responder</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryCard({ title, value, icon: Icon, tone }: { title: string; value: number; icon: LucideIcon; tone: "warning" | "success" | "accent" | "danger" }) {
  const toneClass = {
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
    danger: "bg-destructive/10 text-destructive",
  }[tone]

  return (
    <Card className="tdb-polished-card rounded-[2rem]">
      <CardContent className="flex items-center gap-3 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-black text-foreground">{value}</p></div>
      </CardContent>
    </Card>
  )
}
