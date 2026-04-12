import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bell, Loader2, Search, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { toast } from "sonner"

type NotificationType = "info" | "success" | "warning" | "error"

interface NotificationItem {
  id: string
  title: string
  message: string
  type: NotificationType
  priority?: string
  createdAt?: string
  read?: boolean
  targetUrl?: string
}

interface NotificationsResponse {
  notifications?: NotificationItem[]
  items?: NotificationItem[]
}

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string; bgColor: string }> = {
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  success: { icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
  warning: { icon: AlertCircle, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  error: { icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
}

export default function AdminNotificacoesPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [openingId, setOpeningId] = useState<string | null>(null)

  useEffect(() => {
    void fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const token = getToken()
      const data = await apiFetch<NotificationsResponse>("/api/admin/notifications", { cache: "no-store" }, token)
      setNotifications(data.notifications || data.items || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar notificações")
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAllRead() {
    try {
      const token = getToken()
      await apiFetch("/api/admin/notifications/mark-all-read", { method: "POST" }, token)
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
      toast.success("Todas as notificações foram marcadas como lidas")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao marcar notificações")
    }
  }

  async function handleOpenNotification(notification: NotificationItem) {
    try {
      setOpeningId(notification.id)
      const token = getToken()
      if (!notification.read) {
        await apiFetch(`/api/admin/notifications/${encodeURIComponent(notification.id)}/read`, { method: "POST" }, token)
        setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      }
      navigate(notification.targetUrl || "/admin/notificacoes")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao abrir notificação")
    } finally {
      setOpeningId(null)
    }
  }

  const filteredNotifications = useMemo(() => notifications.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  ), [notifications, searchTerm])

  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Notificações</h1>
              <p className="text-sm text-muted-foreground">Clique em uma notificação para abrir a tela relacionada.</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllRead}>Marcar todas como lidas</Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notificações do sistema
                    {unreadCount > 0 && <Badge>{unreadCount} novas</Badge>}
                  </CardTitle>
                  <CardDescription>Abra aprovações, mensagens internas e outros alertas do painel.</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar notificações..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">Nenhuma notificação encontrada.</div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((item) => {
                    const type = item.type in typeConfig ? item.type : "info"
                    const Icon = typeConfig[type].icon
                    return (
                      <button key={item.id} type="button" className="block w-full text-left" onClick={() => void handleOpenNotification(item)}>
                        <div className={`rounded-xl border p-4 transition-colors hover:border-primary/40 ${item.read ? 'bg-card' : 'bg-muted/40'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 rounded-lg p-2 ${typeConfig[type].bgColor}`}>
                                <Icon className={`h-4 w-4 ${typeConfig[type].color}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">{item.title}</p>
                                  {!item.read && <Badge variant="secondary">Nova</Badge>}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                                <p className="mt-2 text-xs text-muted-foreground">{item.createdAt || "Sem data"}</p>
                                <p className="mt-2 text-xs font-medium text-primary">{openingId === item.id ? "Abrindo..." : "Clique para abrir"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
