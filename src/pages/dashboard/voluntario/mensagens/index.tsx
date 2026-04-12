import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { MessageSquare, ArrowLeft, Send, User, Loader2, Shield, Users } from "lucide-react"
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

interface UnifiedThread {
  threadId: string
  threadType: "case_public" | "case_internal"
  caseId: number
  beneficiaryName?: string
  volunteerName?: string | null
  title?: string
  subtitle?: string | null
  statusLabel?: string
  lastMessage?: string
  lastMessageAt?: string | null
  unreadCount?: number
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

function mergeThreads(rawThreads: ConversationThread[]) {
  const publicThreads: UnifiedThread[] = rawThreads
    .filter((thread) => thread.threadType === "case_public")
    .map((thread) => ({
      threadId: thread.threadId,
      threadType: "case_public" as const,
      caseId: thread.caseId,
      beneficiaryName: thread.beneficiaryName,
      volunteerName: thread.volunteerName,
      title: thread.title || thread.beneficiaryName || "Conversa",
      subtitle: thread.subtitle || "Conversa pública do caso",
      statusLabel: thread.statusLabel,
      lastMessage: thread.lastMessage,
      lastMessageAt: thread.lastMessageAt,
      unreadCount: thread.unreadCount || 0,
      approvalIds: [],
    }))
    .sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))

  const grouped = new Map<number, ConversationThread[]>()
  rawThreads
    .filter((thread) => thread.threadType !== "case_public")
    .forEach((thread) => {
      const current = grouped.get(thread.caseId) || []
      current.push(thread)
      grouped.set(thread.caseId, current)
    })

  const internalThreads: UnifiedThread[] = Array.from(grouped.values())
    .map((group) => {
      const ordered = [...group].sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))
      const base = group.find((thread) => thread.threadType === "case_internal") || ordered[0]
      const latest = ordered[0]
      const approvalIds = group.map((thread) => thread.approvalId).filter((value): value is string => Boolean(value))
      const approvalCount = approvalIds.length

      return {
        threadId: `case-unified-${base.caseId}`,
        threadType: "case_internal" as const,
        caseId: base.caseId,
        beneficiaryName: base.beneficiaryName,
        volunteerName: base.volunteerName,
        title: base.beneficiaryName ? `Interno • ${base.beneficiaryName}` : base.title || "Interno",
        subtitle: approvalCount > 0 ? `${approvalCount} aprovação(ões) vinculada(s) a este beneficiário` : "Chat interno com o Admin",
        statusLabel: latest.statusLabel || base.statusLabel,
        lastMessage: latest.lastMessage || base.lastMessage,
        lastMessageAt: latest.lastMessageAt || base.lastMessageAt,
        unreadCount: group.reduce((acc, item) => acc + (item.unreadCount || 0), 0),
        approvalIds,
      }
    })
    .sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))

  return [...publicThreads, ...internalThreads]
}

function findInitialThread(rawThreads: ConversationThread[], threads: UnifiedThread[], requestedThreadId: string | null) {
  if (requestedThreadId) {
    const rawMatch = rawThreads.find((thread) => thread.threadId === requestedThreadId)
    if (rawMatch) {
      if (rawMatch.threadType === "case_public") {
        return threads.find((thread) => thread.threadId === rawMatch.threadId) || null
      }
      return threads.find((thread) => thread.threadId === `case-unified-${rawMatch.caseId}`) || null
    }
    const directMatch = threads.find((thread) => thread.threadId === requestedThreadId)
    if (directMatch) return directMatch
  }
  return threads[0] || null
}

export default function VoluntarioMensagensPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedThreadId = searchParams.get("thread") || searchParams.get("threadId")
  const [threads, setThreads] = useState<UnifiedThread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeThread, setActiveThread] = useState<UnifiedThread | null>(null)
  const [activeTab, setActiveTab] = useState<ViewTab>("public")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const user = getUser()

  async function loadThreadMessages(thread: UnifiedThread) {
    try {
      setIsLoadingMessages(true)
      const token = getToken()
      if (!token) return

      if (thread.threadType === "case_public") {
        const data = await apiFetch<Message[]>(`/api/communication/cases/${thread.caseId}/messages`, {}, token)
        setMessages((data || []).filter((message) => !message.isInternal))
      } else {
        const [caseMessages, ...approvalMessages] = await Promise.all([
          apiFetch<Message[]>(`/api/communication/cases/${thread.caseId}/messages`, {}, token),
          ...thread.approvalIds.map((approvalId) => apiFetch<Message[]>(`/api/communication/approvals/${approvalId}/messages`, {}, token)),
        ])
        const mergedMessages = [
          ...(caseMessages || []).filter((message) => message.isInternal),
          ...approvalMessages.flat(),
        ].sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt))
        setMessages(mergedMessages)
      }

      setActiveThread(thread)
      setActiveTab(tabForThread(thread.threadType))
      setSearchParams({ thread: thread.threadId })
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

        const data = await apiFetch<ConversationsResponse>("/api/communication/volunteers/me/messages", {}, token)
        const rawThreads = data.threads || [
          ...(data.items || []),
          ...(data.internalThreads || []),
          ...(data.approvalThreads || []),
        ]
        const mergedThreads = mergeThreads(rawThreads)
        setThreads(mergedThreads)

        if (mergedThreads.length > 0) {
          const initialThread = findInitialThread(rawThreads, mergedThreads, requestedThreadId)
          if (initialThread) await loadThreadMessages(initialThread)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar conversas")
      } finally {
        setIsLoading(false)
      }
    }

    void loadConversations()
  }, [navigate, requestedThreadId])

  async function handleSendMessage() {
    if (!newMessage.trim() || !activeThread) return

    try {
      setIsSending(true)
      const token = getToken()
      if (!token) return

      if (activeThread.threadType === "case_public") {
        await apiFetch(
          `/api/communication/cases/${activeThread.caseId}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ content: newMessage, messageType: "TEXT", audience: "BENEFICIARY", scope: "CASE" }),
          },
          token,
        )
      } else {
        await apiFetch(
          `/api/communication/cases/${activeThread.caseId}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ content: newMessage, messageType: "TEXT", audience: "VOLUNTEER_ADMIN", scope: "CASE" }),
          },
          token,
        )
      }

      setNewMessage("")
      await loadThreadMessages(activeThread)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem")
    } finally {
      setIsSending(false)
    }
  }

  const filteredThreads = useMemo(() => threads.filter((thread) => tabForThread(thread.threadType) === activeTab), [threads, activeTab])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Voluntario"} userType="voluntario" notificationCount={0} />
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
      <DashboardHeader userName={user?.full_name || "Voluntario"} userType="voluntario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/voluntario">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          {error && <AlertBanner type="error" title="Erro" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ViewTab)}>
            <TabsList className="mb-4 grid w-full grid-cols-2 lg:w-[320px]">
              <TabsTrigger value="public" className="gap-2"><Users className="h-4 w-4" />Casos</TabsTrigger>
              <TabsTrigger value="internal" className="gap-2"><Shield className="h-4 w-4" />Interno</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Conversas
                    </CardTitle>
                    <CardDescription>
                      {activeTab === "public" ? "Beneficiário + voluntário" : "Admin + voluntário com aprovações unificadas por beneficiário"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredThreads.length > 0 ? (
                      filteredThreads.map((thread) => (
                        <button
                          key={thread.threadId}
                          onClick={() => void loadThreadMessages(thread)}
                          className={`w-full rounded-lg border p-3 text-left transition-all hover:border-primary/30 ${
                            activeThread?.threadId === thread.threadId ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-foreground">{thread.title || thread.beneficiaryName || "Conversa"}</p>
                                <Badge variant="outline">{thread.threadType === "case_public" ? "Público" : "Interno"}</Badge>
                                {thread.threadType === "case_internal" && thread.approvalIds.length > 0 ? <Badge variant="secondary">Aprovação vinculada</Badge> : null}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {thread.subtitle || thread.lastMessage || "Sem mensagens ainda"}
                              </p>
                            </div>
                            {!!thread.unreadCount && <Badge className="bg-primary text-primary-foreground">{thread.unreadCount}</Badge>}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Nenhuma conversa.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {activeThread ? (
                        <>
                          <User className="h-5 w-5 text-primary" />
                          {activeThread.title || activeThread.beneficiaryName}
                        </>
                      ) : (
                        "Selecione uma conversa"
                      )}
                    </CardTitle>
                    {activeThread?.subtitle ? <CardDescription>{activeThread.subtitle}</CardDescription> : null}
                  </CardHeader>
                  <CardContent>
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : activeThread ? (
                      <div className="space-y-4">
                        <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
                          {messages.length > 0 ? (
                            messages.map((msg, index) => {
                              const isMine = msg.senderType === "volunteer" || msg.senderRole === "volunteer" || msg.senderRole === "VOLUNTARIO"
                              return (
                                <div key={msg.id || index} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-[80%] rounded-lg p-3 ${isMine ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
                                      <span>{msg.senderName || msg.sender}</span>
                                      {msg.createdAt ? <span>{new Date(msg.createdAt).toLocaleString("pt-BR")}</span> : null}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Textarea
                            placeholder={
                              activeThread.threadType === "case_public"
                                ? "Digite sua mensagem para o beneficiário..."
                                : "Digite sua mensagem interna para o Admin sobre este beneficiário..."
                            }
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
                          <Button onClick={() => void handleSendMessage()} disabled={!newMessage.trim() || isSending} className="self-end">
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Selecione uma conversa.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
