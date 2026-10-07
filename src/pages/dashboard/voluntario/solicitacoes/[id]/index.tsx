import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerPageHero } from "@/components/dashboard/volunteer-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  History
} from "lucide-react"
import { apiFetch, type ApprovalMessage } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface RequestDetail {
  id: string
  public_id?: string
  beneficiario: string
  beneficiario_id?: number
  tipo: string
  procedimento: string
  justificativa?: string
  diagnostico?: string
  planoTratamento?: string
  status: string
  prioridade: string
  dataSolicitacao: string
  dataAtualizacao?: string
  messages?: ApprovalMessage[]
  historico?: Array<{
    data: string
    acao: string
    autor: string
    detalhes?: string
  }>
}

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

export default function SolicitacaoDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [newComment, setNewComment] = useState("")
  const [userName, setUserName] = useState("...")

  useEffect(() => {
    const user = getUser()
    if (user?.full_name) {
      setUserName(user.full_name)
    }
  }, [])

  const loadRequest = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      }
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const data = await apiFetch<RequestDetail>(`/api/volunteers/procedure-requests/${params.id}`, {}, token)
      setRequest(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!params.id) {
      return
    }

    loadRequest(true)

    const interval = window.setInterval(() => {
      loadRequest(false)
    }, 7000)

    return () => window.clearInterval(interval)
  }, [params.id, navigate])

  const handleSendComment = async () => {
    if (!newComment.trim() || !request) return

    setIsSending(true)
    try {
      const token = getToken()
      if (!token) return

      const sentMessage = await apiFetch<ApprovalMessage>(
        `/api/volunteers/procedure-requests/${params.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: newComment }),
        },
        token
      )

      setRequest(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []), sentMessage]
      } : null)
      setNewComment("")
      await loadRequest(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar comentário")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName="..." userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando detalhes...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <div className="container mx-auto px-4">
            <div className="space-y-4 py-12">
              <div className="flex items-center gap-2 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error || "Solicitação não encontrada"}
              </div>
              <Button variant="outline" asChild className="h-10 rounded-full font-bold">
                <Link to="/dashboard/voluntario/solicitacoes">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Solicitações
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <HelpButton />
      </div>
    )
  }

  const status = statusMap[request.status] || statusMap.pendente
  const prioridade = prioridadeMap[request.prioridade] || prioridadeMap.normal
  const StatusIcon = status.icon

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <VolunteerPageHero
            eyebrow="Solicitação"
            title={request.public_id || request.id}
            description={request.procedimento}
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            backTo="/dashboard/voluntario/solicitacoes"
            backLabel="Voltar para solicitações"
            meta={(
              <>
                <span>{prioridade.label}</span>
                <span>{status.label}</span>
                <span>{request.beneficiario}</span>
              </>
            )}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Detalhes do procedimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Beneficiário:</span>
                    <span>{request.beneficiario}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={`rounded-full ${prioridade.color}`}>{prioridade.label}</Badge>
                    <Badge variant="outline" className={`rounded-full ${status.color}`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  <Separator />

                  {request.justificativa && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Justificativa</h4>
                      <p className="mt-1">{request.justificativa}</p>
                    </div>
                  )}

                  {request.diagnostico && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Diagnóstico</h4>
                        <p className="mt-1">{request.diagnostico}</p>
                      </div>
                    </>
                  )}

                  {request.planoTratamento && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Plano de Tratamento</h4>
                        <pre className="mt-1 whitespace-pre-wrap text-sm">{request.planoTratamento}</pre>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Comunicação com Admin
                  </CardTitle>
                  <CardDescription>
                    Troque mensagens com a coordenação sobre esta solicitação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 max-h-[400px] space-y-4 overflow-y-auto rounded-[2rem] border border-border bg-muted/30 p-4">
                    {(request.messages || []).length > 0 ? (
                      request.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderRole === "volunteer" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl p-4 shadow-sm ${
                              msg.senderRole === "volunteer"
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-background text-foreground"
                            }`}
                          >
                            {msg.senderRole !== "volunteer" && (
                              <p className="mb-1 text-xs font-semibold opacity-70">{msg.senderName || "Admin"}</p>
                            )}
                            <p className="text-sm leading-6">{msg.content}</p>
                            <p className={`mt-2 text-xs ${msg.senderRole === "volunteer" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleString("pt-BR") : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <MessageSquare className="mb-2 h-10 w-10 opacity-50" />
                        <p>Nenhuma mensagem ainda</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Enviar mensagem</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Textarea
                        id="comment"
                        placeholder="Digite sua mensagem..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="min-h-[88px] flex-1 rounded-2xl"
                      />
                      <Button
                        onClick={handleSendComment}
                        disabled={!newComment.trim() || isSending}
                        className="h-12 rounded-full px-6 font-black sm:h-auto sm:min-h-[88px] sm:rounded-2xl"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="ml-2 sm:sr-only">Enviar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data da Solicitação</p>
                      <p className="text-sm font-medium">
                        {request.dataSolicitacao ? new Date(request.dataSolicitacao).toLocaleDateString("pt-BR") : "-"}
                      </p>
                    </div>
                  </div>

                  {request.dataAtualizacao && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Última Atualização</p>
                        <p className="text-sm font-medium">
                          {new Date(request.dataAtualizacao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="text-sm font-medium capitalize">{request.tipo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {request.historico && request.historico.length > 0 && (
                <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <History className="h-5 w-5 text-primary" />
                      Histórico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative space-y-4">
                      {request.historico.map((item, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-primary p-1.5">
                              <Clock className="h-2 w-2 text-primary-foreground" />
                            </div>
                            {index < request.historico!.length - 1 && (
                              <div className="h-full w-px bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="text-sm font-medium">{item.acao}</p>
                            {item.detalhes && (
                              <p className="text-xs text-muted-foreground">{item.detalhes}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.data} - {item.autor}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {request.status === "info_adicional" && (
                <Card className="tdb-polished-card rounded-[2rem] border-accent/50 bg-accent/5 shadow-xl shadow-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-accent" />
                      <div>
                        <p className="font-medium">Informações solicitadas</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          O admin solicitou informações adicionais. Por favor, responda usando o campo de mensagens acima.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
