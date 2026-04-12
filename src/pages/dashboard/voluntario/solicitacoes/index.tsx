import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ArrowLeft,
  Eye,
  MessageSquare,
  Loader2,
  AlertCircle,
  User
} from "lucide-react"
import { apiFetch, type ProcedureRequest } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  em_analise: { label: "Em Análise", color: "bg-primary/10 text-primary border-primary/30", icon: Clock },
  aprovado: { label: "Aprovado", color: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
  rejeitado: { label: "Rejeitado", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
  info_adicional: { label: "Info Solicitada", color: "bg-accent/10 text-accent border-accent/30", icon: AlertTriangle },
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
    if (user?.full_name) {
      setUserName(user.full_name)
    }
  }, [])

  const loadRequests = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      }
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const data = await apiFetch<ProcedureRequest[]>("/api/volunteers/procedure-requests", {}, token)
      setRequests(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar solicitações")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests(true)

    const interval = window.setInterval(() => {
      loadRequests(false)
    }, 7000)

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
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
    <div className="flex min-h-screen flex-col bg-secondary">
      <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
      
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Button variant="ghost" size="sm" asChild className="mb-2">
                <Link to="/dashboard/voluntario">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Minhas Solicitações
              </h1>
              <p className="text-muted-foreground">
                Acompanhe o status das solicitações de procedimentos
              </p>
            </div>
            <Button asChild>
              <Link to="/dashboard/voluntario/solicitacoes/nova">
                <FilePlus className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Link>
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por beneficiário, procedimento ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="pendentes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pendentes" className="gap-2">
                <Clock className="h-4 w-4" />
                Pendentes
                <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="aprovados" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Aprovados
                <Badge variant="secondary" className="ml-1">{approvedRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejeitados" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejeitados
                <Badge variant="secondary" className="ml-1">{rejectedRequests.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes" className="space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="aprovados" className="space-y-4">
              {approvedRequests.length > 0 ? (
                approvedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nenhuma solicitação aprovada</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejeitados" className="space-y-4">
              {rejectedRequests.length > 0 ? (
                rejectedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <XCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nenhuma solicitação rejeitada</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}

function RequestCard({ request }: { request: ProcedureRequest }) {
  const status = statusMap[request.status] || statusMap.pendente
  const prioridade = prioridadeMap[request.prioridade] || prioridadeMap.normal
  const StatusIcon = status.icon

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">{request.public_id || request.id}</Badge>
              <Badge className={prioridade.color}>{prioridade.label}</Badge>
              <Badge variant="outline" className={status.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">{request.procedimento}</h3>
              {request.justificativa && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {request.justificativa}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{request.beneficiario}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{request.dataSolicitacao ? new Date(request.dataSolicitacao).toLocaleDateString("pt-BR") : "-"}</span>
              </div>
            </div>

            {/* Admin Comments */}
            {request.adminComments && request.adminComments.length > 0 && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Última mensagem do Admin:</p>
                <p className="text-sm">{request.adminComments[request.adminComments.length - 1].content}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:ml-6 lg:w-40">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/voluntario/solicitacoes/${request.public_id || request.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </Link>
            </Button>
            {request.status === "info_adicional" && (
              <Button size="sm" asChild>
                <Link to={`/dashboard/voluntario/solicitacoes/${request.public_id || request.id}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Responder
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
