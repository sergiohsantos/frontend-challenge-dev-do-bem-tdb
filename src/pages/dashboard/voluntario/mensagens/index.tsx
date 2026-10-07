import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerPageHero } from "@/components/dashboard/volunteer-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Loader2, MessageSquare, Send, Shield, User, Users, Clock } from "lucide-react"
import { apiFetch, type Message } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

type ThreadType = "case_public" | "case_internal" | "approval"
type ViewTab = "public" | "internal"

interface ConversationThread {
  threadId: string
  threadType: ThreadType
  caseId: number
  approvalId?: string | null
  beneficiaryName?: string
  volunteerName?: string | null
  title?: string
  subtitle?: string | null
  statusLabel?: string
  lastMessage?: string
  lastMessageAt?: string | null
  unreadCount?: number
}

interface UnifiedThread extends Omit<ConversationThread, "threadType" | "approvalId"> {
  threadType: "case_public" | "case_internal"
  approvalIds: string[]
}

interface ConversationsResponse {
  items?: ConversationThread[]
  threads?: ConversationThread[]
  internalThreads?: ConversationThread[]
  approvalThreads?: ConversationThread[]
}

const tabForThread = (type: ThreadType | "case_internal") => (type === "case_public" ? "public" : "internal")

function getTimestamp(value?: string | null) {
  const parsed = value ? new Date(value).getTime() : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function orderMessages(items: Message[]) {
  return [...items].sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt))
}

function mergeThreads(rawThreads: ConversationThread[]) {
  const publicThreads: UnifiedThread[] = rawThreads
    .filter((thread) => thread.threadType === "case_public")
    .map((thread) => ({
      ...thread,
      threadType: "case_public" as const,
      title: thread.title || thread.beneficiaryName || "Conversa",
      subtitle: thread.subtitle || "Conversa pública do caso",
      unreadCount: thread.unreadCount || 0,
      approvalIds: [],
    }))
    .sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))

  const grouped = new Map<number, ConversationThread[]>()
  rawThreads.filter((thread) => thread.threadType !== "case_public").forEach((thread) => {
    grouped.set(thread.caseId, [...(grouped.get(thread.caseId) || []), thread])
  })

  const internalThreads: UnifiedThread[] = Array.from(grouped.values()).map((group) => {
    const ordered = [...group].sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))
    const base = group.find((thread) => thread.threadType === "case_internal") || ordered[0]
    const latest = ordered[0]
    const approvalIds = group.map((thread) => thread.approvalId).filter((value): value is string => Boolean(value))
    return {
      ...base,
      threadId: `case-unified-${base.caseId}`,
      threadType: "case_internal" as const,
      title: base.beneficiaryName ? `Interno • ${base.beneficiaryName}` : base.title || "Interno",
      subtitle: approvalIds.length > 0 ? `${approvalIds.length} aprovação(ões) vinculada(s) a este beneficiário` : "Chat interno com a equipe TDB",
      statusLabel: latest.statusLabel || base.statusLabel,
      lastMessage: latest.lastMessage || base.lastMessage,
      lastMessageAt: latest.lastMessageAt || base.lastMessageAt,
      unreadCount: group.reduce((acc, item) => acc + (item.unreadCount || 0), 0),
      approvalIds,
    }
  }).sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))

  return [...publicThreads, ...internalThreads]
}

function findInitialThread(rawThreads: ConversationThread[], threads: UnifiedThread[], requestedThreadId: string | null, requestedCaseId: string | null) {
  if (requestedThreadId) {
    const rawMatch = rawThreads.find((thread) => thread.threadId === requestedThreadId)
    if (rawMatch) return threads.find((thread) => thread.threadId === (rawMatch.threadType === "case_public" ? rawMatch.threadId : `case-unified-${rawMatch.caseId}`)) || null
    return threads.find((thread) => thread.threadId === requestedThreadId) || null
  }
  if (requestedCaseId) {
    const caseId = Number(requestedCaseId)
    if (Number.isFinite(caseId)) return threads.find((thread) => thread.caseId === caseId) || null
  }
  return threads[0] || null
}

function isMine(message: Message) {
  return message.senderType === "volunteer" || message.senderRole === "volunteer" || message.senderRole === "VOLUNTARIO"
}

export default function VoluntarioMensagensPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedThreadId = searchParams.get("thread") || searchParams.get("threadId")
  const requestedCaseId = searchParams.get("caseId")
  const [threads, setThreads] = useState<UnifiedThread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeThread, setActiveThread] = useState<UnifiedThread | null>(null)
  const [activeTab, setActiveTab] = useState<ViewTab>("public")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const user = getUser()

  function scrollToLatest(behavior: ScrollBehavior = "auto") {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior, block: "end" }), 0)
  }

  async function loadThreadMessages(thread: UnifiedThread) {
    try {
      setIsLoadingMessages(true)
      const token = getToken()
      if (!token) return
      if (thread.threadType === "case_public") {
        const data = await apiFetch<Message[]>(`/api/communication/cases/${thread.caseId}/messages`, {}, token)
        setMessages(orderMessages((data || []).filter((message) => !message.isInternal)))
      } else {
        const [caseMessages, ...approvalMessages] = await Promise.all([
          apiFetch<Message[]>(`/api/communication/cases/${thread.caseId}/messages`, {}, token),
          ...thread.approvalIds.map((approvalId) => apiFetch<Message[]>(`/api/communication/approvals/${approvalId}/messages`, {}, token)),
        ])
        setMessages(orderMessages([...(caseMessages || []).filter((message) => message.isInternal), ...approvalMessages.flat()]))
      }
      setActiveThread(thread)
      setActiveTab(tabForThread(thread.threadType))
      setSearchParams({ thread: thread.threadId })
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
        const data = await apiFetch<ConversationsResponse>("/api/communication/volunteers/me/messages", {}, token)
        const rawThreads = data.threads || [...(data.items || []), ...(data.internalThreads || []), ...(data.approvalThreads || [])]
        const mergedThreads = mergeThreads(rawThreads)
        setThreads(mergedThreads)
        const initialThread = findInitialThread(rawThreads, mergedThreads, requestedThreadId, requestedCaseId)
        if (initialThread) await loadThreadMessages(initialThread)
      } catch {
        setError("Não foi possível carregar suas conversas agora. Tente novamente em instantes.")
      } finally {
        setIsLoading(false)
      }
    }
    void loadConversations()
  }, [navigate, requestedThreadId, requestedCaseId])

  useEffect(() => {
    if (!isLoadingMessages) scrollToLatest()
  }, [messages, isLoadingMessages])

  async function handleSendMessage() {
    if (!newMessage.trim() || !activeThread) return
    try {
      setIsSending(true)
      const token = getToken()
      if (!token) return
      await apiFetch(`/api/communication/cases/${activeThread.caseId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: newMessage,
          messageType: "TEXT",
          audience: activeThread.threadType === "case_public" ? "BENEFICIARY" : "VOLUNTEER_ADMIN",
          scope: "CASE",
        }),
      }, token)
      setNewMessage("")
      await loadThreadMessages(activeThread)
      scrollToLatest("smooth")
    } catch {
      setError("Não foi possível enviar a mensagem agora.")
    } finally {
      setIsSending(false)
    }
  }

  const filteredThreads = useMemo(() => threads.filter((thread) => tabForThread(thread.threadType) === activeTab), [threads, activeTab])
  const publicCount = threads.filter((thread) => thread.threadType === "case_public").length
  const internalCount = threads.filter((thread) => thread.threadType === "case_internal").length

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8"><div className="container mx-auto px-4"><DashboardSkeleton /></div></main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <VolunteerPageHero
            eyebrow="Mensagens"
            title="Conversas organizadas por caso e contexto."
            description="Separe comunicação com beneficiários de conversas internas com a equipe TDB, mantendo histórico e encaminhamentos no mesmo fluxo."
            icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
            meta={(
              <>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{publicCount} conversa(s) com casos</span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{internalCount} conversa(s) internas</span>
              </>
            )}
          />

          {error && <AlertBanner type="error" title="Atenção" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ViewTab)}>
            <TabsList className="mb-5 grid h-12 w-full grid-cols-2 rounded-full bg-muted lg:w-[360px]">
              <TabsTrigger value="public" className="gap-2 rounded-full"><Users className="h-4 w-4" />Casos</TabsTrigger>
              <TabsTrigger value="internal" className="gap-2 rounded-full"><Shield className="h-4 w-4" />Interno</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
                <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-black"><MessageSquare className="h-5 w-5 text-primary" />Conversas</CardTitle>
                    <CardDescription>{activeTab === "public" ? "Beneficiário e voluntário" : "Equipe TDB e voluntário"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredThreads.length > 0 ? filteredThreads.map((thread) => (
                      <button
                        key={thread.threadId}
                        onClick={() => void loadThreadMessages(thread)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 ${activeThread?.threadId === thread.threadId ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-black text-foreground">{thread.title || thread.beneficiaryName || "Conversa"}</p>
                              <Badge variant="outline" className="rounded-full">{thread.threadType === "case_public" ? "Público" : "Interno"}</Badge>
                              {thread.threadType === "case_internal" && thread.approvalIds.length > 0 ? <Badge variant="secondary" className="rounded-full">Aprovação vinculada</Badge> : null}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{thread.lastMessage || thread.subtitle || "Sem mensagens ainda"}</p>
                            {thread.lastMessageAt && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{new Date(thread.lastMessageAt).toLocaleString("pt-BR")}</p>}
                          </div>
                          {!!thread.unreadCount && <Badge className="rounded-full bg-primary text-primary-foreground">{thread.unreadCount}</Badge>}
                        </div>
                      </button>
                    )) : (
                      <Empty variant="subtle" className="py-8">
                        <EmptyMedia variant="icon"><MessageSquare className="h-6 w-6" /></EmptyMedia>
                        <EmptyTitle className="text-base">Nenhuma conversa</EmptyTitle>
                        <EmptyDescription>As conversas deste contexto aparecerão aqui.</EmptyDescription>
                      </Empty>
                    )}
                  </CardContent>
                </Card>

                <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-black">
                      {activeThread ? <><User className="h-5 w-5 text-primary" />{activeThread.title || activeThread.beneficiaryName}</> : "Selecione uma conversa"}
                    </CardTitle>
                    {activeThread?.subtitle ? <CardDescription>{activeThread.subtitle}</CardDescription> : null}
                  </CardHeader>
                  <CardContent>
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : activeThread ? (
                      <div className="space-y-4">
                        <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-[2rem] border border-border bg-muted/30 p-4">
                          {messages.length > 0 ? messages.map((msg, index) => {
                            const mine = isMine(msg)
                            return (
                              <div key={msg.id || index} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[82%] rounded-2xl p-3 shadow-sm ${mine ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}`}>
                                  <p className="text-sm leading-6">{msg.content}</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs opacity-70">
                                    <span>{msg.senderName || msg.sender}</span>
                                    {msg.createdAt ? <span>{new Date(msg.createdAt).toLocaleString("pt-BR")}</span> : null}
                                  </div>
                                </div>
                              </div>
                            )
                          }) : (
                            <div className="rounded-2xl border bg-background p-6 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</div>
                          )}
                          <div ref={bottomRef} />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Textarea
                            placeholder={activeThread.threadType === "case_public" ? "Digite sua mensagem para o beneficiário..." : "Digite sua mensagem interna para a equipe TDB sobre este beneficiário..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="min-h-[88px] rounded-2xl"
                            onKeyDown={(event) => {
                              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void handleSendMessage()
                            }}
                          />
                          <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending} className="h-12 rounded-full px-6 font-black sm:h-auto sm:min-h-[88px] sm:rounded-2xl">
                            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            <span className="ml-2 sm:sr-only">Enviar</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Empty variant="subtle" className="py-12">
                        <EmptyMedia variant="primary"><MessageSquare className="h-8 w-8" /></EmptyMedia>
                        <EmptyTitle>Selecione uma conversa</EmptyTitle>
                        <EmptyDescription>Escolha um caso na lista para visualizar o histórico.</EmptyDescription>
                      </Empty>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
