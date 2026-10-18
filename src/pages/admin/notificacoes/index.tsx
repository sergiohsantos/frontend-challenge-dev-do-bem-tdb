import { useMemo, useState } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDateTime } from "@/lib/dates"
import { AlertBanner } from "@/components/ui/alert-banner"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bell, Loader2, Search, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"

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

function normalizeNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? "Notificação"),
    message: String(raw.message ?? raw.description ?? ""),
    type: String(raw.type ?? "info") as NotificationType,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    read: Boolean(raw.read),
    targetUrl: raw.targetUrl ? String(raw.targetUrl) : undefined,
  }
}

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string; bgColor: string }> = {
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  success: { icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
  warning: { icon: AlertCircle, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  error: { icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
}

export default function AdminNotificacoesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { notifications, isLoading: loading, loadError, error, setError, isMarkingAll, openingId, markAllAsRead: handleMarkAllRead, openNotification: handleOpenNotification, retry } = useNotifications(
    "/api/admin/notifications", "/admin/notificacoes", normalizeNotification,
  )

  const filteredNotifications = useMemo(() => notifications.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  ), [notifications, searchTerm])

  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main id="main-content" tabIndex={-1} className="overflow-x-hidden p-4 sm:p-6">
          <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Notificações</h1>
              <p className="text-sm text-muted-foreground">Clique em uma notificação para abrir a tela relacionada.</p>
            </div>
            {unreadCount > 0 && <Button variant="outline" onClick={handleMarkAllRead} disabled={isMarkingAll || openingId !== null} className="h-11 rounded-full font-bold">Marcar todas como lidas</Button>}
          </div>

          {error && <AlertBanner type="error" title="Atenção" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}
          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notificações do sistema
                    {unreadCount > 0 && <Badge className="rounded-full">{unreadCount} novas</Badge>}
                  </CardTitle>
                  <CardDescription>Abra aprovações, mensagens internas e outros alertas do painel.</CardDescription>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar notificações..." className="h-11 pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : loadError ? (
                <div className="space-y-4 py-8" role="alert">
                  <p>{loadError}</p>
                  <Button onClick={retry}>Tentar novamente</Button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma notificação encontrada.</div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((item) => {
                    const type = item.type in typeConfig ? item.type : "info"
                    const Icon = typeConfig[type].icon
                    return (
                      <button key={item.id} type="button" className="block w-full text-left disabled:opacity-60" disabled={isMarkingAll || openingId !== null} onClick={() => void handleOpenNotification(item)}>
                        <div className={`rounded-2xl border p-4 transition-all hover:border-primary/40 hover:shadow-md ${item.read ? "bg-card" : "bg-primary/5"}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${typeConfig[type].bgColor}`}>
                              <Icon className={`h-5 w-5 ${typeConfig[type].color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-foreground">{item.title}</p>
                                {!item.read && <Badge variant="secondary" className="rounded-full">Nova</Badge>}
                              </div>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</p>
                              <p className="mt-2 text-xs text-muted-foreground">{item.createdAt ? formatDateTime(item.createdAt) : "Sem data"}</p>
                              <p className="mt-2 text-xs font-black text-primary">{openingId === item.id ? "Abrindo..." : "Clique para abrir"}</p>
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
