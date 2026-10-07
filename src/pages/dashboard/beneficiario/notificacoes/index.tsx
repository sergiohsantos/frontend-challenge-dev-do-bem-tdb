import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BeneficiaryPageHero } from "@/components/dashboard/beneficiary-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertBanner } from "@/components/ui/alert-banner"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { AlertCircle, Bell, Calendar, CheckCircle2, FileText, Loader2, MessageSquare } from "lucide-react"

interface NotificationItem {
  id: string
  title: string
  message: string
  description?: string
  type: "appointment" | "message" | "document" | "alert" | "info"
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

export default function BeneficiarioNotificacoesPage() {
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

        const data = await apiFetch<NotificationsResponse | NotificationItem[]>("/api/beneficiaries/me/notifications", { cache: "no-store" }, token)
        const items = Array.isArray(data) ? data : data.notifications || data.items || []
        setNotifications(items.map((item) => normalizeNotification(item as unknown as Record<string, unknown>)))
        setError(null)
      } catch {
        setError("Não foi possível carregar suas notificações agora. Tente novamente em instantes.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadNotifications()
  }, [navigate])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])
  const readCount = notifications.length - unreadCount

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }
      await apiFetch("/api/beneficiaries/me/notifications/mark-all-read", { method: "POST" }, token)
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch {
      setError("Não foi possível marcar as notificações como lidas agora.")
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
        await apiFetch(`/api/beneficiaries/me/notifications/${encodeURIComponent(notification.id)}/read`, { method: "POST" }, token)
        setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      }

      navigate(notification.targetUrl || "/dashboard/beneficiario")
    } catch {
      setError("Não foi possível abrir esta notificação agora.")
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
      case "document":
        return <FileText className="h-5 w-5 text-success" />
      case "alert":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
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
      <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={unreadCount} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <BeneficiaryPageHero
            eyebrow="Notificações"
            title="Acompanhe os avisos importantes do seu atendimento."
            description="Consultas, mensagens, documentos e atualizações do caso aparecem aqui para você não perder nenhum próximo passo."
            icon={<Bell className="h-4 w-4" aria-hidden="true" />}
            primaryAction={notifications.length > 0 ? (
              <Button size="lg" variant="outline" onClick={markAllAsRead} disabled={isMarkingAll || unreadCount === 0} className="h-14 rounded-full border-primary-foreground/30 bg-transparent text-base font-black text-primary-foreground hover:bg-primary-foreground/10">
                {isMarkingAll ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Marcar como lidas
              </Button>
            ) : undefined}
            meta={(
              <>
                <span>{unreadCount} nova(s)</span>
                <span>{readCount} lida(s)</span>
              </>
            )}
          />

          {error && <AlertBanner type="error" title="Atenção" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Card className="tdb-polished-card rounded-[2rem]">
                <CardContent className="py-12">
                  <Empty variant="subtle">
                    <EmptyMedia variant="primary"><Bell className="h-8 w-8" /></EmptyMedia>
                    <EmptyTitle>Nenhuma notificação disponível</EmptyTitle>
                    <EmptyDescription>Quando houver atualização de consulta, mensagem ou documento, ela aparecerá aqui.</EmptyDescription>
                  </Empty>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <button key={notification.id} type="button" className="block w-full text-left" onClick={() => void openNotification(notification)}>
                  <Card className={`tdb-polished-card rounded-[2rem] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 ${notification.read ? "bg-background opacity-80" : "border-primary/20 bg-card"}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${notification.read ? "bg-muted" : "bg-primary/10"}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <p className={`font-black ${notification.read ? "text-muted-foreground" : "text-foreground"}`}>{notification.title}</p>
                              {!notification.read ? <Badge variant="secondary" className="rounded-full">Nova</Badge> : null}
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">{notification.date ? new Date(notification.date).toLocaleString("pt-BR") : ""}</span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                          <div className="mt-3 text-xs font-black text-primary">{openingId === notification.id ? "Abrindo..." : "Clique para abrir"}</div>
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

      <HelpButton />
    </div>
  )
}
