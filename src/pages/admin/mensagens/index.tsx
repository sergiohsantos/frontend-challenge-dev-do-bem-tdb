import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Search, Send, Shield, Users } from "lucide-react"
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

interface UnifiedThread extends Omit<ThreadItem, "threadType" | "approvalId"> {
  threadType: "case_public" | "case_internal"
  approvalIds: string[]
}

interface AdminMessagesResponse { threads?: ThreadItem[] }

const tabForThread = (type: ThreadType | "case_internal") => (type === "case_public" ? "public" : "internal")

function getTimestamp(value?: string | null) {
  const parsed = value ? new Date(value).getTime() : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function orderMessages(items: Message[]) {
  return [...items].sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt))
}

function mergeThreads(rawThreads: ThreadItem[]) {
  const publicThreads: UnifiedThread[] = rawThreads
    .filter((thread) => thread.threadType === "case_public")
    .map((thread) => ({ ...thread, threadType: "case_public" as const, title: thread.title || thread.beneficiaryName || "Conversa", subtitle: thread.subtitle || "Conversa pública do caso", unreadCount: thread.unreadCount || 0, approvalIds: [] }))
    .sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))

  const grouped = new Map<number, ThreadItem[]>()
  rawThreads.filter((thread) => thread.threadType !== "case_public").forEach((thread) => grouped.set(thread.caseId, [...(grouped.get(thread.caseId) || []), thread]))

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
      subtitle: [base.volunteerName ? `Voluntário: ${base.volunteerName}` : null, approvalIds.length > 0 ? `${approvalIds.length} aprovação(ões) vinculada(s)` : "Chat interno do caso"].filter(Boolean).join(" • "),
      status: latest.status || base.status,
      statusLabel: latest.statusLabel || base.statusLabel,
      lastMessage: latest.lastMessage || base.lastMessage,
      lastMessageAt: latest.lastMessageAt || base.lastMessageAt,
      unreadCount: group.reduce((acc, item) => acc + (item.unreadCount || 0), 0),
      approvalIds,
    }
  }).sort((a, b) => getTimestamp(b.lastMessageAt) - getTimestamp(a.lastMessageAt))

  return [...publicThreads, ...internalThreads]
}

function findInitialThread(rawThreads: ThreadItem[], threads: UnifiedThread[], requestedThreadId: string | null) {
  if (requestedThreadId) {
    const rawMatch = rawThreads.find((thread) => thread.threadId === requestedThreadId)
    if (rawMatch) return threads.find((thread) => thread.threadId === (rawMatch.threadType === "case_public" ? rawMatch.threadId : `case-unified-${rawMatch.caseId}`)) || null
    return threads.find((thread) => thread.threadId === requestedThreadId) || null
  }
  return threads[0] || null
}

function getThreadBadges(thread: UnifiedThread) {
  return (
    <>
      <Badge variant="outline" className="rounded-full">{thread.threadType === "case_public" ? "Público" : "Interno"}</Badge>
      {thread.threadType === "case_internal" && thread.approvalIds.length > 0 ? <Badge variant="secondary" className="rounded-full">Aprovação vinculada</Badge> : null}
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
  const bottomRef = useRef<HTMLDivElement>(null)

  function scrollToLatest(behavior: ScrollBehavior = "auto") {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior, block: "end" }), 0)
  }

  useEffect(() => { void fetchThreads() }, [])

  async function fetchThreads() {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) { navigate("/admin/login", { replace: true }); return }
      const response = await apiFetch<AdminMessagesResponse>("/api/admin/messages", {}, token)
      const rawThreads = response.threads || []
      const mergedThreads = mergeThreads(rawThreads)
      setThreads(mergedThreads)
      const initialThread = findInitialThread(rawThreads, mergedThreads, requestedThreadId)
      if (initialThread) { setActiveTab(tabForThread(initialThread.threadType)); await openThread(initialThread, false) } else { setActiveThread(null); setMessages([]) }
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
      if (updateUrl) setSearchParams({ thread: thread.threadId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao abrir conversa")
    } finally {
      setIsLoadingMessages(false)
      scrollToLatest()
    }
  }

  async function handleSendMessage() {
    if (!activeThread || !newMessage.trim()) return
    try {
      setSending(true)
      const token = getToken()
      if (!token) return
      await apiFetch(`/api/communication/cases/${activeThread.caseId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: newMessage, messageType: "TEXT", audience: activeThread.threadType === "case_public" ? "BENEFICIARY" : "VOLUNTEER_ADMIN", scope: "CASE" }),
      }, token)
      setNewMessage("")
      await openThread(activeThread)
      await fetchThreads()
      scrollToLatest("smooth")
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
    return base.filter((thread) => [thread.title, thread.subtitle, thread.beneficiaryName, thread.volunteerName, thread.lastMessage].filter(Boolean).join(" ").toLowerCase().includes(term))
  }, [threads, searchTerm, activeTab])

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main className="overflow-x-hidden p-4 sm:p-6">
          <div className="mb-6 min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Mensagens</h1>
            <p className="text-sm text-muted-foreground">O chat interno reúne Admin + voluntário + histórico de aprovação por beneficiário, em uma única conversa.</p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ViewTab)}>
            <TabsList className="mb-4 grid h-auto w-full grid-cols-2 rounded-2xl p-1 lg:w-[360px]"><TabsTrigger value="public" className="gap-2 rounded-full"><Users className="h-4 w-4" />Público</TabsTrigger><TabsTrigger value="internal" className="gap-2 rounded-full"><Shield className="h-4 w-4" />Interno</TabsTrigger></TabsList>
            <TabsContent value={activeTab}>
              <Card className="min-w-0">
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Central de mensagens</CardTitle><CardDescription>{activeTab === "public" ? "Beneficiário + voluntário" : "Admin + voluntário, por beneficiário, com aprovações unificadas"}</CardDescription></div>
                    <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar conversas..." /></div>
                  </div>
                </CardHeader>
                <CardContent>{loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-3 lg:col-span-1">
                      {filteredThreads.length === 0 ? <div className="rounded-2xl border bg-card p-6 text-center text-sm leading-6 text-muted-foreground">Nenhuma conversa encontrada. Ajuste a busca ou volte para aprovações e beneficiários para abrir um caso relacionado.</div> : filteredThreads.map((thread) => (
                        <button key={thread.threadId} onClick={() => void openThread(thread)} className={`w-full rounded-2xl border p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm ${activeThread?.threadId === thread.threadId ? "border-primary bg-primary/5" : "bg-card"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-foreground">{thread.title || thread.beneficiaryName || "Conversa"}</p>{getThreadBadges(thread)}{thread.statusLabel ? <Badge variant="secondary" className="rounded-full">{thread.statusLabel}</Badge> : null}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{thread.lastMessage || thread.subtitle || "Sem mensagens"}</p></div>{!!thread.unreadCount && <Badge className="rounded-full bg-primary text-primary-foreground">{thread.unreadCount}</Badge>}</div></button>
                      ))}
                    </div>

                    <div className="lg:col-span-2">
                      {!activeThread ? <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">Selecione uma conversa para ver o histórico e responder com segurança.</div> : <div className="space-y-4"><div className="rounded-2xl border bg-card p-4"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-foreground">{activeThread.title || activeThread.beneficiaryName}</p>{getThreadBadges(activeThread)}{activeThread.statusLabel ? <Badge variant="secondary" className="rounded-full">{activeThread.statusLabel}</Badge> : null}</div>{activeThread.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{activeThread.subtitle}</p> : null}</div>
                        <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border bg-muted/30 p-4">{isLoadingMessages ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : messages.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma mensagem nesta conversa. Envie uma orientação curta quando houver uma ação pendente.</div> : messages.map((message, index) => { const mine = message.senderRole === "admin" || message.senderRole === "ADMIN"; return <div key={message.id || index} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl p-3 shadow-sm ${mine ? "bg-primary text-primary-foreground" : "border bg-background"}`}><p className="text-sm leading-6">{message.content}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs opacity-70"><span>{message.senderName}</span>{message.createdAt ? <span>{new Date(message.createdAt).toLocaleString("pt-BR")}</span> : null}</div></div></div> })}<div ref={bottomRef} /></div>
                        <div className="rounded-2xl border bg-card p-4"><div className="flex flex-col gap-3 sm:flex-row"><Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={activeThread.threadType === "case_public" ? "Digite uma mensagem para o chat do caso..." : "Digite uma mensagem interna para o voluntário responsável por este beneficiário..."} className="min-h-[96px] rounded-2xl" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendMessage() } }} /><Button onClick={() => void handleSendMessage()} disabled={!newMessage.trim() || sending} className="h-12 gap-2 rounded-full font-black sm:h-auto sm:min-h-[96px] sm:rounded-2xl">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Enviar</Button></div></div></div>}
                    </div>
                  </div>
                )}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
