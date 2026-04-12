import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertBanner } from "@/components/ui/alert-banner"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { AlertCircle, ArrowLeft, Bell, Calendar, CheckCircle2, FileCheck, Loader2, MessageSquare, Users } from "lucide-react"

interface NotificationItem {
  id: string
  title: string
  message: string
  description?: string
  type: "appointment" | "message" | "patient" | "approval" | "alert" | "info"
  date?: string
  createdAt?: string
  read: boolean
  targetUrl?: string
}

interface NotificationsResponse {
  notifications?: NotificationItem[]
  items?: NotificationItem[]
}

function normalizeNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? "Notificação"),
    message: String(raw.message ?? raw.description ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    type: String(raw.type ?? "info") as NotificationItem["type"],
    date: raw.date ? String(raw.date) : raw.createdAt ? String(raw.createdAt) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    read: Boolean(raw.read),
    targetUrl: raw.targetUrl ? String(raw.targetUrl) : undefined,
  }
}

export default function VoluntarioNotificacoesPage() {
  const navigate = useNavigate()
  const user = getUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login", { replace: true })
          return
        }

        const data = await apiFetch<NotificationsResponse | NotificationItem[]>("/api/volunteers/me/notifications", { cache: "no-store" }, token)
        const items = Array.isArray(data) ? data : data.notifications || data.items || []
        setNotifications(items.map((item) => normalizeNotification(item as unknown as Record<string, unknown>)))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar notificações")
      } finally {
        setIsLoading(false)
      }
    }

    void loadNotifications()
  }, [navigate])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }
      await apiFetch("/api/volunteers/me/notifications/mark-all-read", { method: "POST" }, token)
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao marcar notificações como lidas")
    } finally {
      setIsMarkingAll(false)
    }
  }

  const openNotification = async (notification: NotificationItem) => {
    try {
      setOpeningId(notification.id)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      if (!notification.read) {
        await apiFetch(`/api/volunteers/me/notifications/${encodeURIComponent(notification.id)}/read`, { method: "POST" }, token)
        setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      }

      navigate(notification.targetUrl || "/dashboard/voluntario")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir notificação")
    } finally {
      setOpeningId(null)
    }
  }

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-5 w-5 text-primary" />
      case "message":
        return <MessageSquare className="h-5 w-5 text-accent" />
      case "patient":
        return <Users className="h-5 w-5 text-success" />
      case "approval":
        return <FileCheck className="h-5 w-5 text-warning" />
      case "alert":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <div className="container mx-auto px-4">
            <DashboardSkeleton />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={unreadCount} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/voluntario">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
          </Button>

          {error && <AlertBanner type="error" title="Erro" message={error} dismissible onDismiss={() => setError(null)} className="mb-4" />}

          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Notificações</h1>
              <p className="mt-1 text-muted-foreground">Clique em uma notificação para abrir o item relacionado.</p>
            </div>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={isMarkingAll || unreadCount === 0}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isMarkingAll ? "Salvando..." : "Marcar todas como lidas"}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma notificação disponível.
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <button key={notification.id} type="button" className="block w-full text-left" onClick={() => void openNotification(notification)}>
                  <Card className={notification.read ? "bg-background opacity-80" : "border-primary/20 bg-background"}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${notification.read ? "bg-muted" : "bg-primary/10"}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`font-medium ${notification.read ? "text-muted-foreground" : "text-foreground"}`}>{notification.title}</p>
                              {!notification.read ? <Badge variant="secondary">Nova</Badge> : null}
                            </div>
                            <span className="text-xs text-muted-foreground">{notification.date ? new Date(notification.date).toLocaleString("pt-BR") : ""}</span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                          <div className="mt-3 text-xs font-medium text-primary">{openingId === notification.id ? "Abrindo..." : "Clique para abrir"}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
