import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { MessageSquare, ArrowLeft, Send, Loader2, Calendar, FileText } from "lucide-react"
import { apiFetch, type Message } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface BeneficiaryThread {
  threadId: string
  caseId: number
  beneficiaryName?: string
  volunteerName?: string | null
  subtitle?: string | null
  lastMessage?: string
  lastMessageAt?: string | null
  unreadCount?: number
  messages?: Message[]
}

interface MessagesResponse {
  items?: BeneficiaryThread[]
  conversations?: BeneficiaryThread[]
  threads?: BeneficiaryThread[]
  messages?: Message[]
}

export default function BeneficiarioMensagensPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCaseId = searchParams.get("caseId")
  const selectedThreadParam = searchParams.get("thread")

  const [threads, setThreads] = useState<BeneficiaryThread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [caseId, setCaseId] = useState<number | null>(selectedCaseId ? Number(selectedCaseId) : null)
  const [activeVolunteerName, setActiveVolunteerName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = getUser()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function loadMessagesForCase(targetCaseId: number, thread?: BeneficiaryThread) {
    try {
      setIsLoadingMessages(true)
      const token = getToken()
      if (!token) return
      const data = await apiFetch<Message[]>(`/api/communication/cases/${targetCaseId}/messages`, {}, token)
      setMessages(data || [])
      setCaseId(targetCaseId)
      setActiveVolunteerName(thread?.volunteerName || "Equipe de atendimento")
      setSearchParams({ caseId: String(targetCaseId), thread: thread?.threadId || `case-public-${targetCaseId}` })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens")
    } finally {
      setIsLoadingMessages(false)
    }
  }

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login")
          return
        }

        const data = await apiFetch<MessagesResponse>("/api/communication/beneficiaries/me/messages", {}, token)
        const loadedThreads = data.threads || data.conversations || data.items || []
        setThreads(loadedThreads)

        if (loadedThreads.length > 0) {
          const initialThread = selectedCaseId
            ? loadedThreads.find((item) => item.caseId === Number(selectedCaseId)) || loadedThreads[0]
            : loadedThreads[0]
          await loadMessagesForCase(initialThread.caseId, initialThread)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar mensagens")
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [navigate, selectedCaseId, selectedThreadParam])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !caseId) return

    try {
      setIsSending(true)
      const token = getToken()
      if (!token) return

      await apiFetch(`/api/communication/cases/${caseId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: newMessage, messageType: "TEXT" }),
      }, token)

      setNewMessage("")
      const activeThread = threads.find((item) => item.caseId === caseId || item.threadId === selectedThreadParam)
      await loadMessagesForCase(caseId, activeThread)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Beneficiario"} userType="beneficiario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <div className="container mx-auto px-4">
            <DashboardSkeleton />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={user?.full_name || "Beneficiario"} userType="beneficiario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/beneficiario">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>

          {error && (
            <AlertBanner
              type="error"
              title="Erro"
              message={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mb-6"
            />
          )}

          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Mensagens do atendimento</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use este espaço para dúvidas sobre sua consulta, documentos ou orientações recebidas.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link to="/dashboard/beneficiario/consultas">
                    <Calendar className="mr-2 h-4 w-4" />
                    Consultas
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/dashboard/beneficiario/documentos">
                    <FileText className="mr-2 h-4 w-4" />
                    Documentos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Conversas
                </CardTitle>
                <CardDescription>{threads.length} conversa(s) ativa(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {threads.length > 0 ? (
                  threads.map((thread) => {
                    const title = thread.volunteerName || "Equipe de atendimento"
                    return (
                      <button
                        key={thread.threadId}
                        onClick={() => void loadMessagesForCase(thread.caseId, thread)}
                        className={`w-full rounded-lg border p-3 text-left transition-all hover:border-primary/30 ${
                          caseId === thread.caseId ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {thread.lastMessage || thread.subtitle || "Conversa ativa"}
                            </p>
                          </div>
                          {!!thread.unreadCount && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <Empty variant="subtle" className="py-8">
                    <EmptyMedia variant="icon">
                      <MessageSquare className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle className="text-sm">Nenhuma conversa ainda</EmptyTitle>
                    <EmptyDescription className="text-xs">
                      A conversa será exibida quando seu caso estiver em atendimento.
                    </EmptyDescription>
                  </Empty>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {activeVolunteerName || "Selecione uma conversa"}
                </CardTitle>
                <CardDescription>
                  Comunicação com a equipe responsável pelo seu atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : caseId ? (
                  <>
                    <div className="mb-4 max-h-[400px] space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
                      {messages.length > 0 ? (
                        <>
                          {messages.map((msg, index) => (
                            <div
                              key={msg.id || index}
                              className={`flex ${msg.senderType === "user" || msg.senderRole === "beneficiary" || msg.senderRole === "BENEFICIARIO" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.senderType === "user" || msg.senderRole === "beneficiary" || msg.senderRole === "BENEFICIARIO"
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border bg-background"
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
                                  <span>{msg.senderName || msg.sender}</span>
                                  {msg.createdAt && (
                                    <>
                                      <span>-</span>
                                      <span>{new Date(msg.createdAt).toLocaleString("pt-BR")}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <Empty variant="subtle" className="py-8">
                          <EmptyMedia variant="icon">
                            <MessageSquare className="h-6 w-6" />
                          </EmptyMedia>
                          <EmptyTitle className="text-sm">Nenhuma mensagem ainda</EmptyTitle>
                          <EmptyDescription className="text-xs">
                            Envie uma mensagem para iniciar a conversa.
                          </EmptyDescription>
                        </Empty>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[80px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            void handleSendMessage()
                          }
                        }}
                      />
                      <Button
                        onClick={() => void handleSendMessage()}
                        disabled={!newMessage.trim() || isSending}
                        className="self-end"
                      >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Empty variant="subtle" className="py-12">
                    <EmptyMedia variant="icon">
                      <MessageSquare className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle className="text-sm">Selecione uma conversa</EmptyTitle>
                    <EmptyDescription className="text-xs">
                      Escolha uma conversa na coluna ao lado para visualizar as mensagens.
                    </EmptyDescription>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
