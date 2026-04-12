import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import {
  ArrowLeft,
  User,
  Stethoscope,
  Calendar,
  FileText,
  Download,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  History,
  Phone,
  Mail,
  MapPin,
  Brain,
  Smile,
  Loader2
} from "lucide-react"
import { apiFetch, type ApprovalDetail } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { apiUpload } from "@/lib/api"
import { downloadFromApi } from "@/lib/file-download"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data removed - now using API data

const prioridadeMap = {
  urgente: { label: "Urgente", color: "bg-destructive text-destructive-foreground" },
  alta: { label: "Alta", color: "bg-accent text-accent-foreground" },
  normal: { label: "Normal", color: "bg-muted text-muted-foreground" },
}

const statusMap = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/30" },
  em_analise: { label: "Em Analise", color: "bg-primary/10 text-primary border-primary/30" },
  aprovado: { label: "Aprovado", color: "bg-success/10 text-success border-success/30" },
  rejeitado: { label: "Rejeitado", color: "bg-destructive/10 text-destructive border-destructive/30" },
}

// Default empty data for safe rendering
const emptyData: ApprovalDetail = {
  id: "",
  beneficiario: { nome: "", idade: 0, cidade: "", uf: "", telefone: "", dataIngresso: "", responsavel: "" },
  voluntario: { nome: "", especialidade: "", crm: "", telefone: "", email: "", clinica: "", atendimentosRealizados: 0, avaliacaoMedia: 0 },
  procedimento: { tipo: "", titulo: "", descricao: "", justificativa: "", diagnostico: "", planoTratamento: "", materiaisNecessarios: [] },
  prioridade: "normal",
  status: "pendente",
  dataSolicitacao: "",
  anexos: [],
  historico: [],
  atendimentosAnteriores: [],
}

interface VolunteerOption {
  id: number
  nome: string
  especialidade?: string
  cidade?: string
  uf?: string
  status?: string
}

export default function DetalheSolicitacaoPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"aprovar" | "rejeitar" | "info" | null>(null)
  const [comentario, setComentario] = useState("")
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([])
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [assignedVolunteerId, setAssignedVolunteerId] = useState<string>("")
  
  // API state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [solicitacao, setSolicitacao] = useState<ApprovalDetail>(emptyData)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docTitle, setDocTitle] = useState("")
  const [docNotes, setDocNotes] = useState("")
  const [docVisible, setDocVisible] = useState(false)

  // Load approval detail from API
  useEffect(() => {
    const loadDetail = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/admin/login", { replace: true })
          return
        }
        
        const [data, volunteersResponse] = await Promise.all([
          apiFetch<ApprovalDetail>(`/api/admin/approvals/${params.id}`, {}, token),
          apiFetch<{ volunteers?: VolunteerOption[]; items?: VolunteerOption[] }>("/api/admin/volunteers", {}, token),
        ])
        const volunteerItems = volunteersResponse.volunteers || volunteersResponse.items || []
        setSolicitacao(data)
        setVolunteers(volunteerItems)
        const currentSpecialty = data.voluntario.especialidade?.trim() || ""
        setSpecialtyFilter(currentSpecialty || "all")
        setAssignedVolunteerId(data.voluntario.id ? String(data.voluntario.id) : "")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar detalhes")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (params.id) {
      loadDetail()
    }
  }, [params.id, navigate])

  const specialtyOptions = useMemo(() => {
    const values = Array.from(new Set(volunteers.map((item) => (item.especialidade || "").trim()).filter(Boolean)))
    return values.sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [volunteers])

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((item) => {
      if (item.status && item.status !== "ativo") return false
      if (specialtyFilter === "all") return true
      return (item.especialidade || "").trim() === specialtyFilter
    })
  }, [specialtyFilter, volunteers])

  useEffect(() => {
    if (!filteredVolunteers.length) {
      setAssignedVolunteerId("")
      return
    }
    if (!filteredVolunteers.some((item) => String(item.id) === assignedVolunteerId)) {
      const currentVolunteerId = solicitacao.voluntario.id ? String(solicitacao.voluntario.id) : ""
      if (currentVolunteerId && filteredVolunteers.some((item) => String(item.id) === currentVolunteerId)) {
        setAssignedVolunteerId(currentVolunteerId)
        return
      }
      setAssignedVolunteerId(String(filteredVolunteers[0].id))
    }
  }, [assignedVolunteerId, filteredVolunteers, solicitacao.voluntario.id])

  const handleAction = (action: "aprovar" | "rejeitar" | "info") => {
    setActionType(action)
    setComentario("")
    if (action === "aprovar") {
      const currentSpecialty = solicitacao.voluntario.especialidade?.trim() || ""
      setSpecialtyFilter(currentSpecialty || "all")
      setAssignedVolunteerId(solicitacao.voluntario.id ? String(solicitacao.voluntario.id) : "")
    }
    setDialogOpen(true)
  }

  const handleAttachmentDownload = async (anexo: { nome: string; tamanho?: string; tipo?: string; url?: string }) => {
    try {
      const token = getToken()
      if (!token) return
      if (anexo.url && anexo.url.startsWith('/')) {
        await downloadFromApi(anexo.url, token, anexo.nome || 'anexo')
        return
      }
      if (anexo.url) {
        window.open(anexo.url, '_blank', 'noopener,noreferrer')
        return
      }
      throw new Error('Este anexo não possui arquivo disponível para download.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar anexo')
    }
  }

  const handleUploadApprovalDocument = async () => {
    if (!docFile) {
      setError('Selecione um arquivo para anexar ao prontuário.')
      return
    }
    try {
      setUploadingDoc(true)
      setError(null)
      const token = getToken()
      if (!token) return
      const formData = new FormData()
      formData.append('file', docFile)
      formData.append('title', docTitle || docFile.name)
      formData.append('notes', docNotes)
      formData.append('category', 'procedimento')
      formData.append('visible_to_beneficiary', String(docVisible))
      await apiUpload(`/api/admin/approvals/${params.id}/documents`, formData, token)
      setDocFile(null)
      setDocTitle('')
      setDocNotes('')
      setDocVisible(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao anexar documento ao prontuário')
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleConfirmAction = async () => {
    setIsSubmitting(true)
    try {
      const token = getToken()
      if (!token) return
      
      let endpoint = ""
      switch (actionType) {
        case "aprovar":
          endpoint = `/api/admin/approvals/${params.id}/approve`
          break
        case "rejeitar":
          endpoint = `/api/admin/approvals/${params.id}/reject`
          break
        case "info":
          endpoint = `/api/admin/approvals/${params.id}/request-info`
          break
      }
      
      const payload: { comment: string; assignedVolunteerId?: number } = { comment: comentario }
      if (actionType === "aprovar" && assignedVolunteerId) {
        payload.assignedVolunteerId = Number(assignedVolunteerId)
      }

      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      }, token)
      
      setDialogOpen(false)
      navigate("/admin/aprovacoes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar acao")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4 py-12">
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/aprovacoes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Aprovacoes
          </Link>
        </Button>
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
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin/aprovacoes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Aprovacoes
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{solicitacao.public_id || solicitacao.id}</h1>
            <Badge className={prioridadeMap[solicitacao.prioridade as keyof typeof prioridadeMap]?.color || "bg-muted"}>
              {prioridadeMap[solicitacao.prioridade as keyof typeof prioridadeMap]?.label || solicitacao.prioridade}
            </Badge>
            <Badge variant="outline" className={statusMap[solicitacao.status as keyof typeof statusMap]?.color || "bg-muted"}>
              {statusMap[solicitacao.status as keyof typeof statusMap]?.label || solicitacao.status}
            </Badge>
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            {solicitacao.procedimento.titulo}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {solicitacao.beneficiaryId ? (
            <Button variant="outline" asChild>
              <Link to={`/admin/beneficiarios/${solicitacao.beneficiaryId}?section=documents`}>
                <FileText className="mr-2 h-4 w-4" />
                Abrir prontuário
              </Link>
            </Button>
          ) : null}
          <Button 
            className="bg-success hover:bg-success/90"
            onClick={() => handleAction("aprovar")}
            disabled={solicitacao.status === 'aprovado' || solicitacao.status === 'rejeitado'}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Aprovar
          </Button>
          <Button 
            variant="destructive"
            onClick={() => handleAction("rejeitar")}
            disabled={solicitacao.status === 'aprovado' || solicitacao.status === 'rejeitado'}
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
            Rejeitar
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleAction("info")}
            disabled={solicitacao.status === 'aprovado' || solicitacao.status === 'rejeitado'}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Pedir Info
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Procedimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5 text-primary" />
                Detalhes do Procedimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Descricao</h4>
                <p className="mt-1">{solicitacao.procedimento.descricao}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Justificativa Clinica</h4>
                <p className="mt-1">{solicitacao.procedimento.justificativa}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Diagnostico</h4>
                <p className="mt-1">{solicitacao.procedimento.diagnostico}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Plano de Tratamento</h4>
                <pre className="mt-1 whitespace-pre-wrap text-sm">{solicitacao.procedimento.planoTratamento}</pre>
              </div>
              
              <Separator />
              
              {(solicitacao.procedimento.materiaisNecessarios?.length ?? 0) > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Materiais Necessarios</h4>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {solicitacao.procedimento.materiaisNecessarios?.map((material, index) => (
                      <li key={index}>{material}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anexos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary" />
                Anexos e Documentacao
              </CardTitle>
              <CardDescription>{solicitacao.anexos?.length || 0} arquivos anexados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="approval-doc-file">Anexar ao prontuário do beneficiário</Label>
                    <Input id="approval-doc-file" type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Título do documento" />
                  <div className="flex items-center gap-2 rounded-md border px-3">
                    <Checkbox checked={docVisible} onCheckedChange={(value) => setDocVisible(Boolean(value))} id="doc-visible" />
                    <Label htmlFor="doc-visible" className="text-sm">Disponibilizar ao beneficiário</Label>
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea value={docNotes} onChange={(e) => setDocNotes(e.target.value)} placeholder="Observações do documento" />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button type="button" onClick={handleUploadApprovalDocument} disabled={uploadingDoc || !docFile}>
                      {uploadingDoc ? 'Enviando...' : 'Adicionar ao prontuário'}
                    </Button>
                  </div>
                </div>
              </div>
              {(solicitacao.anexos?.length ?? 0) > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {solicitacao.anexos?.map((anexo, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{anexo.nome}</p>
                          <p className="text-xs text-muted-foreground">{anexo.tipo} - {anexo.tamanho}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleAttachmentDownload(anexo)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum anexo</p>
              )}
            </CardContent>
          </Card>

          {/* Historico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Historico da Solicitacao
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(solicitacao.historico?.length ?? 0) > 0 ? (
                <div className="relative space-y-4">
                  {solicitacao.historico?.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-primary p-2">
                          <Clock className="h-3 w-3 text-primary-foreground" />
                        </div>
                        {index < (solicitacao.historico?.length || 0) - 1 && (
                          <div className="h-full w-px bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{item.acao}</p>
                        <p className="text-xs text-muted-foreground">{item.detalhes}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.data} - {item.autor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum historico</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Beneficiario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-primary" />
                Beneficiario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {solicitacao.beneficiario.nome.split(" ").map(w => w[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{solicitacao.beneficiario.nome}</p>
                  <p className="text-sm text-muted-foreground">{solicitacao.beneficiario.idade} anos</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{solicitacao.beneficiario.cidade}, {solicitacao.beneficiario.uf}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{solicitacao.beneficiario.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>No programa desde {solicitacao.beneficiario.dataIngresso ? new Date(solicitacao.beneficiario.dataIngresso).toLocaleDateString("pt-BR") : "-"}</span>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Responsavel</p>
                <p className="text-sm font-medium">{solicitacao.beneficiario.responsavel}</p>
              </div>
            </CardContent>
          </Card>

          {/* Voluntario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Stethoscope className="h-5 w-5 text-primary" />
                Voluntario Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-accent/10 text-accent">
                    {solicitacao.voluntario.nome.split(" ").slice(0, 2).map(w => w[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{solicitacao.voluntario.nome}</p>
                  <p className="text-sm text-muted-foreground">{solicitacao.voluntario.especialidade}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{solicitacao.voluntario.crm}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{solicitacao.voluntario.clinica}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{solicitacao.voluntario.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{solicitacao.voluntario.email}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-lg font-bold text-primary">{solicitacao.voluntario.atendimentosRealizados}</p>
                  <p className="text-xs text-muted-foreground">Atendimentos</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-lg font-bold text-accent">{solicitacao.voluntario.avaliacaoMedia}</p>
                  <p className="text-xs text-muted-foreground">Avaliacao</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atendimentos Anteriores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-primary" />
                Historico de Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(solicitacao.atendimentosAnteriores?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {solicitacao.atendimentosAnteriores?.map((atendimento, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{atendimento.procedimento}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(atendimento.data).toLocaleDateString("pt-BR")} - {atendimento.voluntario}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Concluido
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum atendimento anterior</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
              {actionType === "aprovar" && "Confirme a aprovacao do procedimento. O voluntario sera notificado."}
              {actionType === "rejeitar" && "Informe o motivo da rejeicao. O voluntario sera notificado."}
              {actionType === "info" && "Solicite mais informacoes ao voluntario antes de decidir."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">{solicitacao.procedimento.titulo}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Beneficiario: {solicitacao.beneficiario.nome} | Voluntario: {solicitacao.voluntario.nome}
              </p>
            </div>

            {actionType === "aprovar" ? (
              <div className="grid gap-4 rounded-lg border border-border/60 p-4">
                <div className="space-y-2">
                  <Label>Especialidade para atendimento</Label>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as especialidades ativas</SelectItem>
                      {specialtyOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Se necessário, o Admin pode redirecionar a solicitação para outro profissional antes da aprovação.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Voluntário responsável</Label>
                  <Select value={assignedVolunteerId || undefined} onValueChange={setAssignedVolunteerId} disabled={filteredVolunteers.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={filteredVolunteers.length === 0 ? "Nenhum voluntário ativo disponível" : "Selecione o voluntário"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVolunteers.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.nome} • {item.especialidade || "Sem especialidade"}{item.cidade ? ` • ${item.cidade}${item.uf ? `/${item.uf}` : ""}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
            
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={actionType === "aprovar" ? "bg-success hover:bg-success/90" : ""}
              variant={actionType === "rejeitar" ? "destructive" : "default"}
              disabled={(actionType !== "aprovar" && !comentario.trim()) || (actionType === "aprovar" && filteredVolunteers.length > 0 && !assignedVolunteerId) || isSubmitting}
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
