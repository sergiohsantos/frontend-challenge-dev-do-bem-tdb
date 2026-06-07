import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  FileCheck,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  User,
  Stethoscope,
  FileText,
  Download,
  ChevronDown,
  Brain,
  Smile,
  Loader2
} from "lucide-react"
import { Link } from "react-router-dom"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { apiFetch, type ApprovalRequest, type ApprovalKPIs } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { downloadCsv, timestampFile } from "@/lib/admin-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// KPI definitions (values will come from API)
const kpiDefinitions = [
  { key: "pending", title: "Pendentes", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  { key: "approvedToday", title: "Aprovados Hoje", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  { key: "rejected", title: "Rejeitados", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  { key: "urgent", title: "Urgentes", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
]

// Tipos de procedimento
const procedureTypes = [
  { value: "ortodontia", label: "Ortodontia", icon: Smile },
  { value: "protese", label: "Protese", icon: Smile },
  { value: "endodontia", label: "Endodontia", icon: Smile },
  { value: "cirurgia", label: "Cirurgia", icon: Smile },
  { value: "psicologico", label: "Acompanhamento Psicologico", icon: Brain },
  { value: "avaliacao", label: "Avaliacao Inicial", icon: FileText },
]

// Mock data removed - now using real API data

const statusMap = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/30" },
  em_analise: { label: "Em Analise", color: "bg-primary/10 text-primary border-primary/30" },
  aprovado: { label: "Aprovado", color: "bg-success/10 text-success border-success/30" },
  rejeitado: { label: "Rejeitado", color: "bg-destructive/10 text-destructive border-destructive/30" },
  info_adicional: { label: "Info Adicional", color: "bg-muted text-muted-foreground border-muted-foreground/30" },
}

const prioridadeMap = {
  urgente: { label: "Urgente", color: "bg-destructive text-destructive-foreground" },
  alta: { label: "Alta", color: "bg-accent text-accent-foreground" },
  normal: { label: "Normal", color: "bg-muted text-muted-foreground" },
}

export default function AprovacaoPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [programFilter, setProgramFilter] = useState("all")
  const [tipoFilter, setTipoFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"aprovar" | "rejeitar" | "info" | null>(null)
  const [comentario, setComentario] = useState("")
  
  // API state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<ApprovalKPIs>({ pending: 0, approvedToday: 0, rejected: 0, urgent: 0 })
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([])
  const [approvedRequests, setApprovedRequests] = useState<ApprovalRequest[]>([])
  const [rejectedRequests, setRejectedRequests] = useState<ApprovalRequest[]>([])

  const loadApprovals = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      }
      const token = getToken()
      if (!token) {
        navigate("/admin/login", { replace: true })
        return
      }

      const data = await apiFetch<{
        kpis?: ApprovalKPIs
        requests?: ApprovalRequest[]
        approved?: ApprovalRequest[]
        rejected?: ApprovalRequest[]
      }>("/api/admin/approvals", {}, token)

      setKpis(data.kpis || { pending: 0, approvedToday: 0, rejected: 0, urgent: 0 })
      setPendingRequests(data.requests || [])
      setApprovedRequests(data.approved || [])
      setRejectedRequests(data.rejected || [])
      setError(null)
    } catch (err) {
      setError("Nao foi possivel carregar as aprovacoes agora. Tente novamente em instantes.")
    } finally {
      setIsLoading(false)
    }
  }

  // Load approvals from API
  useEffect(() => {
    loadApprovals(true)

    const interval = window.setInterval(() => {
      loadApprovals(false)
    }, 7000)

    return () => window.clearInterval(interval)
  }, [navigate])

  const filteredRequests = pendingRequests.filter((r) => {
    const matchesSearch = r.beneficiario.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.voluntario.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesProgram = programFilter === "all" || r.programa === programFilter
    const matchesTipo = tipoFilter === "all" || r.tipo === tipoFilter
    return matchesSearch && matchesStatus && matchesProgram && matchesTipo
  })
  const priorityRequest = filteredRequests.find((request) => request.prioridade === "urgente") || filteredRequests[0]

  const handleAction = (request: ApprovalRequest, action: "aprovar" | "rejeitar" | "info") => {
    setSelectedRequest(request)
    setActionType(action)
    setComentario("")
    setDialogOpen(true)
  }

  const handleExport = () => {
    downloadCsv(timestampFile("admin-aprovacoes", "csv"), filteredRequests)
  }

  const handleConfirmAction = async () => {
    if (!selectedRequest) return
    
    setIsSubmitting(true)
    try {
      const token = getToken()
      if (!token) return
      
      const approvalId = selectedRequest.public_id || selectedRequest.id
      let endpoint = ""
      
      switch (actionType) {
        case "aprovar":
          endpoint = `/api/admin/approvals/${approvalId}/approve`
          break
        case "rejeitar":
          endpoint = `/api/admin/approvals/${approvalId}/reject`
          break
        case "info":
          endpoint = `/api/admin/approvals/${approvalId}/request-info`
          break
      }
      
      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ comment: comentario }),
      }, token)

      setDialogOpen(false)
      setSelectedRequest(null)
      setActionType(null)
      setComentario("")
      await loadApprovals(false)
    } catch (err) {
      setError("Nao foi possivel concluir a acao agora. Confira o comentario e tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 sm:p-6">
          <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Aprovacões e Laudos
          </h1>
          <p className="text-muted-foreground">
            Gerencie solicitacões de procedimentos e laudos dos voluntários
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {!isLoading && (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiDefinitions.map((kpi) => (
          <Card key={kpi.key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-3xl font-bold">{kpis[kpi.key as keyof ApprovalKPIs] || 0}</p>
                </div>
                <div className={`rounded-lg ${kpi.bg} p-3`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {!isLoading && (
        <Card className="border-primary/20">
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Proxima acao recomendada</p>
              {priorityRequest ? (
                <>
                  <p className="font-semibold text-foreground">
                    Revisar {priorityRequest.procedimento} de {priorityRequest.beneficiario}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Prioridade {prioridadeMap[priorityRequest.prioridade as keyof typeof prioridadeMap]?.label || priorityRequest.prioridade}. Abra os detalhes se precisar conferir anexos antes de decidir.
                  </p>
                </>
              ) : (
                <p className="font-semibold text-foreground">Nenhuma aprovacao pendente agora.</p>
              )}
            </div>
            {priorityRequest ? (
              <Button variant="outline" asChild>
                <Link to={`/admin/aprovacoes/${priorityRequest.public_id || priorityRequest.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Abrir prioridade
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {!isLoading && (
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
          </TabsTrigger>
          <TabsTrigger value="rejeitados" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejeitados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID, beneficiario ou voluntario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_analise">Em Analise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={programFilter} onValueChange={setProgramFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Programa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Dentistas do Bem">Dentistas do Bem</SelectItem>
                      <SelectItem value="Apolonias do Bem">Apolonias do Bem</SelectItem>
                      <SelectItem value="Psicologos Para o Bem">Psicologos Para o Bem</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {procedureTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nenhuma solicitacao pendente</p>
                </CardContent>
              </Card>
            )}
            {filteredRequests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <div className={`h-1 ${request.prioridade === "urgente" ? "bg-destructive" : request.prioridade === "alta" ? "bg-accent" : "bg-muted"}`} />
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left side - Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono">{request.id}</Badge>
                        <Badge className={prioridadeMap[request.prioridade as keyof typeof prioridadeMap].color}>
                          {prioridadeMap[request.prioridade as keyof typeof prioridadeMap].label}
                        </Badge>
                        <Badge variant="outline" className={statusMap[request.status as keyof typeof statusMap].color}>
                          {statusMap[request.status as keyof typeof statusMap].label}
                        </Badge>
                        <Badge variant="outline">{request.programa}</Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold">{request.procedimento}</h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {request.justificativa}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Beneficiario</p>
                            <p className="text-sm font-medium">{request.beneficiario}{(request.idade ?? request.beneficiario_idade) ? `, ${request.idade ?? request.beneficiario_idade} anos` : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Voluntario</p>
                            <p className="text-sm font-medium">{request.voluntario}</p>
                            <p className="text-xs text-muted-foreground">{request.crm}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Data da Solicitacao</p>
                            <p className="text-sm font-medium">
                              {new Date(request.dataSolicitacao).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Anexos</p>
                            <p className="text-sm font-medium">{request.anexos?.length || 0} arquivo(s)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex flex-col gap-2 lg:ml-6 lg:w-48">
                      <Button 
                        className="w-full bg-success hover:bg-success/90"
                        onClick={() => handleAction(request, "aprovar")}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => handleAction(request, "rejeitar")}
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleAction(request, "info")}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Pedir Info
                      </Button>
                      <Button variant="ghost" className="w-full" asChild>
                        <Link to={`/admin/aprovacoes/${request.public_id || request.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="aprovados">
          <Card>
            <CardHeader>
              <CardTitle>Solicitacoes Aprovadas</CardTitle>
              <CardDescription>Historico de aprovacoes recentes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Beneficiario</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Voluntario</TableHead>
                    <TableHead>Data Aprovacao</TableHead>
                    <TableHead>Aprovado Por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedRequests.length > 0 ? (
                    approvedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono">{request.id}</TableCell>
                      <TableCell>{request.beneficiario}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.programa}</Badge>
                      </TableCell>
                      <TableCell>{request.procedimento}</TableCell>
                      <TableCell>{request.voluntario}</TableCell>
                      <TableCell>{request.dataSolicitacao ? new Date(request.dataSolicitacao).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma solicitacao aprovada no periodo selecionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejeitados">
          <Card>
            <CardHeader>
              <CardTitle>Solicitacoes Rejeitadas</CardTitle>
              <CardDescription>Historico de rejeicoes com justificativas</CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Beneficiario</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Voluntario</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono">{request.id}</TableCell>
                        <TableCell>{request.beneficiario}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.programa}</Badge>
                        </TableCell>
                        <TableCell>{request.procedimento}</TableCell>
                        <TableCell>{request.voluntario}</TableCell>
                        <TableCell>{request.dataSolicitacao ? new Date(request.dataSolicitacao).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  Nenhuma solicitacao rejeitada no periodo selecionado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === "aprovar" && "Aprovar Solicitacao"}
              {actionType === "rejeitar" && "Rejeitar Solicitacao"}
              {actionType === "info" && "Solicitar Informacoes Adicionais"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "aprovar" && "Confirme a aprovacao do procedimento abaixo."}
              {actionType === "rejeitar" && "Informe o motivo da rejeicao."}
              {actionType === "info" && "Solicite mais informacoes ao voluntario."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">{selectedRequest.procedimento}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Beneficiario: {selectedRequest.beneficiario} | Voluntario: {selectedRequest.voluntario}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comentario">
                  {actionType === "aprovar" && "Comentario (opcional)"}
                  {actionType === "rejeitar" && "Motivo da rejeicao *"}
                  {actionType === "info" && "Quais informacoes adicionais? *"}
                </Label>
                <Textarea
                  id="comentario"
                  placeholder={
                    actionType === "aprovar" 
                      ? "Adicione um comentario se necessario..." 
                      : actionType === "rejeitar"
                      ? "Explique o motivo da rejeicao..."
                      : "Descreva quais informacoes sao necessarias..."
                  }
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={
                actionType === "aprovar" 
                  ? "bg-success hover:bg-success/90" 
                  : actionType === "rejeitar"
                  ? ""
                  : ""
              }
              variant={actionType === "rejeitar" ? "destructive" : "default"}
              disabled={(actionType !== "aprovar" && !comentario.trim()) || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {actionType === "aprovar" && "Confirmar Aprovacao"}
                  {actionType === "rejeitar" && "Confirmar Rejeicao"}
                  {actionType === "info" && "Enviar Solicitacao"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
