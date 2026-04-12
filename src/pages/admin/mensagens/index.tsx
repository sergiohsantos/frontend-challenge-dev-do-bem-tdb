import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Loader2, Search, Send, Users, Shield } from "lucide-react"
import { apiFetch, type Message } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { toast } from "sonner"

type ThreadType = "case_public" | "case_internal" | "approval"
type ViewTab = "public" | "internal"

interface ThreadItem {
  threadId: string
  threadType: ThreadType
  caseId: number
  approvalId?: string | null
  beneficiaryName?: string
  volunteerName?: string | null
  title?: string
  subtitle?: string | null
  status?: string
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
  status?: string
  statusLabel?: string
  lastMessage?: string
  lastMessageAt?: string | null
  unreadCount?: number
  approvalIds: string[]
}

interface AdminMessagesResponse {
  threads?: ThreadItem[]
}

const tabForThread = (type: ThreadType | "case_internal") => (type === "case_public" ? "public" : "internal")

function getTimestamp(value?: string | null) {
  const parsed = value ? new Date(value).getTime() : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function mergeThreads(rawThreads: ThreadItem[]) {
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
      status: thread.status,
      statusLabel: thread.statusLabel,
      lastMessage: thread.lastMessage,
      lastMessageAt: thread.lastMessageAt,
      unreadCount: thread.unreadCount || 0,
      approvalIds: [],
    }))
    .sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))

  const grouped = new Map<number, ThreadItem[]>()
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
        subtitle: [
          base.volunteerName ? `Voluntário: ${base.volunteerName}` : null,
          approvalCount > 0 ? `${approvalCount} aprovação(ões) vinculada(s)` : "Chat interno do caso",
        ]
          .filter(Boolean)
          .join(" • "),
        status: latest.status || base.status,
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

function findInitialThread(rawThreads: ThreadItem[], threads: UnifiedThread[], requestedThreadId: string | null) {
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

function getThreadBadges(thread: UnifiedThread) {
  return (
    <>
      <Badge variant="outline">{thread.threadType === "case_public" ? "Público" : "Interno"}</Badge>
      {thread.threadType === "case_internal" && thread.approvalIds.length > 0 ? <Badge variant="secondary">Aprovação vinculada</Badge> : null}
    </>
  )
}

export default function AdminMensagensPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedThreadId = searchParams.get("thread") || searchParams.get("threadId")
  const [loading, setLoading] = useState(true)
  const [threads, setThreads] = useState<UnifiedThread[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<ViewTab>("public")
  const [activeThread, setActiveThread] = useState<UnifiedThread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    void fetchThreads()
  }, [])

  async function fetchThreads() {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        navigate("/admin/login", { replace: true })
        return
      }

      const response = await apiFetch<AdminMessagesResponse>("/api/admin/messages", {}, token)
      const rawThreads = response.threads || []
      const mergedThreads = mergeThreads(rawThreads)
      setThreads(mergedThreads)

      const initialThread = findInitialThread(rawThreads, mergedThreads, requestedThreadId)
      if (initialThread) {
        setActiveTab(tabForThread(initialThread.threadType))
        await openThread(initialThread, false)
      } else {
        setActiveThread(null)
        setMessages([])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar mensagens")
    } finally {
      setLoading(false)
    }
  }

  async function openThread(thread: UnifiedThread, updateUrl = true) {
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
      if (updateUrl) setSearchParams({ thread: thread.threadId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao abrir conversa")
    } finally {
      setIsLoadingMessages(false)
    }
  }

  async function handleSendMessage() {
    if (!activeThread || !newMessage.trim()) return
    try {
      setSending(true)
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
      await openThread(activeThread)
      await fetchThreads()
      toast.success("Mensagem enviada com sucesso")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  const filteredThreads = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    const base = threads.filter((thread) => tabForThread(thread.threadType) === activeTab)
    if (!term) return base
    return base.filter((thread) => {
      const haystack = [thread.title, thread.subtitle, thread.beneficiaryName, thread.volunteerName, thread.lastMessage]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [threads, searchTerm, activeTab])

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Mensagens</h1>
            <p className="text-sm text-muted-foreground">O chat interno reúne Admin + voluntário + histórico de aprovação por beneficiário, em uma única conversa.</p>
          </div>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ViewTab)}>
            <TabsList className="mb-4 grid w-full grid-cols-2 lg:w-[320px]">
              <TabsTrigger value="public" className="gap-2"><Users className="h-4 w-4" />Público</TabsTrigger>
              <TabsTrigger value="internal" className="gap-2"><Shield className="h-4 w-4" />Interno</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Central de mensagens
                      </CardTitle>
                      <CardDescription>
                        {activeTab === "public" ? "Beneficiário + voluntário" : "Admin + voluntário, por beneficiário, com aprovações unificadas"}
                      </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar conversas..." />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                      <div className="space-y-3 lg:col-span-1">
                        {filteredThreads.length === 0 ? (
                          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</div>
                        ) : (
                          filteredThreads.map((thread) => (
                            <button
                              key={thread.threadId}
                              onClick={() => void openThread(thread)}
                              className={`w-full rounded-xl border p-4 text-left transition-all hover:border-primary/30 ${activeThread?.threadId === thread.threadId ? "border-primary bg-primary/5" : "bg-card"}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-foreground">{thread.title || thread.beneficiaryName || "Conversa"}</p>
                                    {getThreadBadges(thread)}
                                    {thread.statusLabel ? <Badge variant="secondary">{thread.statusLabel}</Badge> : null}
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{thread.subtitle || thread.lastMessage || "Sem mensagens"}</p>
                                </div>
                                {!!thread.unreadCount && <Badge className="bg-primary text-primary-foreground">{thread.unreadCount}</Badge>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="lg:col-span-2">
                        {!activeThread ? (
                          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">Selecione uma conversa.</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="rounded-xl border bg-card p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-foreground">{activeThread.title || activeThread.beneficiaryName}</p>
                                {getThreadBadges(activeThread)}
                                {activeThread.statusLabel ? <Badge variant="secondary">{activeThread.statusLabel}</Badge> : null}
                              </div>
                              {activeThread.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{activeThread.subtitle}</p> : null}
                            </div>

                            <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border bg-muted/30 p-4">
                              {isLoadingMessages ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                              ) : messages.length === 0 ? (
                                <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma mensagem nesta conversa.</div>
                              ) : (
                                messages.map((message, index) => {
                                  const isMine = message.senderRole === "admin" || message.senderRole === "ADMIN"
                                  return (
                                    <div key={message.id || index} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                      <div className={`max-w-[80%] rounded-lg p-3 ${isMine ? "bg-primary text-primary-foreground" : "border bg-background"}`}>
                                        <p className="text-sm">{message.content}</p>
                                        <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
                                          <span>{message.senderName}</span>
                                          {message.createdAt ? <span>{new Date(message.createdAt).toLocaleString("pt-BR")}</span> : null}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>

                            <div className="rounded-xl border bg-card p-4">
                              <div className="flex gap-3">
                                <Textarea
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  placeholder={
                                    activeThread.threadType === "case_public"
                                      ? "Digite uma mensagem para o chat do caso..."
                                      : "Digite uma mensagem interna para o voluntário responsável por este beneficiário..."
                                  }
                                  className="min-h-[96px]"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault()
                                      void handleSendMessage()
                                    }
                                  }}
                                />
                                <Button onClick={() => void handleSendMessage()} disabled={!newMessage.trim() || sending} className="self-end gap-2">
                                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                  Enviar
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
