import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BeneficiaryPageHero } from "@/components/dashboard/beneficiary-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Calendar, FileText, Loader2, MessageSquare, Send } from "lucide-react"
import { apiFetch, type Message } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface BeneficiaryThread {
  threadId: string
  caseId: number
  volunteerName?: string | null
  subtitle?: string | null
  lastMessage?: string
  lastMessageAt?: string | null
  unreadCount?: number
}

interface MessagesResponse {
  items?: BeneficiaryThread[]
  conversations?: BeneficiaryThread[]
  threads?: BeneficiaryThread[]
}

function timestamp(value?: string | null) {
  const parsed = value ? new Date(value).getTime() : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function orderThreads(items: BeneficiaryThread[]) {
  return [...items].sort((a, b) => timestamp(b.lastMessageAt) - timestamp(a.lastMessageAt))
}

function orderMessages(items: Message[]) {
  return [...items].sort((a, b) => timestamp(a.createdAt) - timestamp(b.createdAt))
}

function isMine(message: Message) {
  return message.senderType === "user" || message.senderRole === "beneficiary" || message.senderRole === "BENEFICIARIO"
}

export default function BeneficiarioMensagensPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCaseId = searchParams.get("caseId")
  const selectedThread = searchParams.get("thread")
  const user = getUser()

  const [threads, setThreads] = useState<BeneficiaryThread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [caseId, setCaseId] = useState<number | null>(selectedCaseId ? Number(selectedCaseId) : null)
  const [activeName, setActiveName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  function scrollToLatest(behavior: ScrollBehavior = "auto") {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior, block: "end" }), 0)
  }

  async function loadMessagesForCase(targetCaseId: number, thread?: BeneficiaryThread) {
    try {
      setIsLoadingMessages(true)
      const token = getToken()
      if (!token) return
      const data = await apiFetch<Message[]>(`/api/communication/cases/${targetCaseId}/messages`, {}, token)
      setMessages(orderMessages(data || []))
      setCaseId(targetCaseId)
      setActiveName(thread?.volunteerName || "Equipe de atendimento")
      setSearchParams({ caseId: String(targetCaseId), thread: thread?.threadId || `case-public-${targetCaseId}` })
    } catch {
      setError("Não foi possível carregar as mensagens desta conversa agora.")
    } finally {
      setIsLoadingMessages(false)
      scrollToLatest()
    }
  }

  useEffect(() => {
    async function loadConversations() {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login")
          return
        }
        const data = await apiFetch<MessagesResponse>("/api/communication/beneficiaries/me/messages", {}, token)
        const loadedThreads = orderThreads(data.threads || data.conversations || data.items || [])
        setThreads(loadedThreads)
        if (loadedThreads.length > 0) {
          const initialThread = selectedCaseId
            ? loadedThreads.find((item) => item.caseId === Number(selectedCaseId)) || loadedThreads[0]
            : loadedThreads[0]
          await loadMessagesForCase(initialThread.caseId, initialThread)
        }
      } catch {
        setError("Não foi possível carregar suas conversas agora. Tente novamente em instantes.")
      } finally {
        setIsLoading(false)
      }
    }
    void loadConversations()
  }, [navigate, selectedCaseId, selectedThread])

  useEffect(() => {
    if (!isLoadingMessages) scrollToLatest()
  }, [messages, isLoadingMessages])

  async function handleSendMessage() {
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
      const activeThread = threads.find((item) => item.caseId === caseId || item.threadId === selectedThread)
      await loadMessagesForCase(caseId, activeThread)
      scrollToLatest("smooth")
    } catch {
      setError("Não foi possível enviar a mensagem agora.")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8"><div className="container mx-auto px-4"><DashboardSkeleton /></div></main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <BeneficiaryPageHero
            eyebrow="Mensagens"
            title="Converse com a equipe sobre seu atendimento."
            description="As mensagens ficam organizadas pelo seu caso para facilitar dúvidas, orientações e próximos passos da jornada."
            icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
            primaryAction={(
              <Button size="lg" asChild className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90">
                <Link to="/dashboard/beneficiario/consultas"><Calendar className="mr-2 h-5 w-5" />Consultas</Link>
              </Button>
            )}
            secondaryAction={(
              <Button size="lg" variant="outline" asChild className="h-14 rounded-full border-primary-foreground/30 bg-transparent text-base font-black text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/dashboard/beneficiario/documentos"><FileText className="mr-2 h-5 w-5" />Documentos</Link>
              </Button>
            )}
            meta={(
              <>
                <span>{threads.length} conversa(s)</span>
                <span>{caseId ? "Conversa ativa" : "Selecione um caso"}</span>
              </>
            )}
          />

          {error && <AlertBanner type="error" title="Atenção" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}

          <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
            <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-black"><MessageSquare className="h-5 w-5 text-primary" />Conversas</CardTitle>
                <CardDescription>{threads.length} conversa(s) ativa(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {threads.length > 0 ? threads.map((thread) => (
                  <button key={thread.threadId} onClick={() => void loadMessagesForCase(thread.caseId, thread)} className={`w-full rounded-2xl border p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 ${caseId === thread.caseId ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-foreground">{thread.volunteerName || "Equipe de atendimento"}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{thread.lastMessage || thread.subtitle || "Conversa ativa"}</p>
                        {thread.lastMessageAt ? <p className="mt-2 text-xs text-muted-foreground/70">{new Date(thread.lastMessageAt).toLocaleString("pt-BR")}</p> : null}
                      </div>
                      {!!thread.unreadCount && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{thread.unreadCount}</span>}
                    </div>
                  </button>
                )) : (
                  <Empty variant="subtle" className="py-8"><EmptyMedia variant="primary"><MessageSquare className="h-6 w-6" /></EmptyMedia><EmptyTitle className="text-base">Nenhuma conversa ainda</EmptyTitle><EmptyDescription>A conversa será exibida quando seu caso estiver em atendimento.</EmptyDescription></Empty>
                )}
              </CardContent>
            </Card>

            <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-black"><MessageSquare className="h-5 w-5 text-primary" />{activeName || "Selecione uma conversa"}</CardTitle>
                <CardDescription>Comunicação com a equipe responsável pelo seu atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : caseId ? (
                  <>
                    <div className="mb-4 max-h-[520px] space-y-3 overflow-y-auto rounded-[2rem] border border-border bg-muted/30 p-4">
                      {messages.length > 0 ? messages.map((msg, index) => (
                        <div key={msg.id || index} className={`flex ${isMine(msg) ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] rounded-2xl p-3 shadow-sm ${isMine(msg) ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}`}>
                            <p className="text-sm leading-6">{msg.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs opacity-70"><span>{msg.senderName || msg.sender}</span>{msg.createdAt ? <><span>-</span><span>{new Date(msg.createdAt).toLocaleString("pt-BR")}</span></> : null}</div>
                          </div>
                        </div>
                      )) : (
                        <Empty variant="subtle" className="py-8"><EmptyMedia variant="primary"><MessageSquare className="h-6 w-6" /></EmptyMedia><EmptyTitle className="text-base">Nenhuma mensagem ainda</EmptyTitle><EmptyDescription>Envie uma mensagem para iniciar a conversa.</EmptyDescription></Empty>
                      )}
                      <div ref={bottomRef} />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Textarea placeholder="Digite sua mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="min-h-[88px] rounded-2xl" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendMessage() } }} />
                      <Button onClick={() => void handleSendMessage()} disabled={!newMessage.trim() || isSending} className="h-12 rounded-full px-6 font-black sm:h-auto sm:min-h-[88px] sm:rounded-2xl">
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span className="ml-2 sm:sr-only">Enviar</span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <Empty variant="subtle" className="py-12"><EmptyMedia variant="primary"><MessageSquare className="h-8 w-8" /></EmptyMedia><EmptyTitle>Selecione uma conversa</EmptyTitle><EmptyDescription>Escolha uma conversa na coluna ao lado para visualizar as mensagens.</EmptyDescription></Empty>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
