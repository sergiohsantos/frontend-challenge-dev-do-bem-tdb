import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"

interface NotificationLink {
  id: string
  read?: boolean
  targetUrl?: string
}

export function useNotifications<T extends NotificationLink>(
  endpoint: string,
  fallback: string,
  normalize: (raw: Record<string, unknown>) => T,
) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const busy = useRef(false)
  const active = useRef(false)

  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setLoadError(null)
    async function load() {
      try {
        const token = getToken()
        if (!token) { navigate("/login", { replace: true }); return }
        const data = await apiFetch<T[] | { notifications?: T[]; items?: T[] }>(endpoint, { cache: "no-store", signal: controller.signal }, token)
        if (controller.signal.aborted) return
        const items = Array.isArray(data) ? data : data.notifications || data.items || []
        setNotifications(items.map(item => normalize(item as unknown as Record<string, unknown>)))
      } catch (cause) {
        if (controller.signal.aborted) return
        if ((cause as { status?: number }).status === 401) navigate("/login", { replace: true })
        else setLoadError("Não foi possível carregar suas notificações agora.")
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [endpoint, navigate, normalize, revision])

  async function markAllAsRead() {
    if (busy.current) return
    busy.current = true
    setIsMarkingAll(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) { navigate("/login", { replace: true }); return }
      await apiFetch(`${endpoint}/mark-all-read`, { method: "POST" }, token)
      if (!active.current) return
      setNotifications(prev => prev.map(item => ({ ...item, read: true })))
    } catch (cause) {
      if (!active.current) return
      if ((cause as { status?: number }).status === 401) navigate("/login", { replace: true })
      else setError("Não foi possível marcar as notificações como lidas agora.")
    } finally {
      busy.current = false
      if (active.current) setIsMarkingAll(false)
    }
  }

  async function openNotification(notification: T) {
    if (busy.current) return
    busy.current = true
    setOpeningId(notification.id)
    setError(null)
    try {
      const token = getToken()
      if (!token) { navigate("/login", { replace: true }); return }
      if (!notification.read) {
        try {
          await apiFetch(`${endpoint}/${encodeURIComponent(notification.id)}/read`, { method: "POST" }, token)
          if (!active.current) return
          setNotifications(prev => prev.map(item => item.id === notification.id ? { ...item, read: true } : item))
        } catch (cause) {
          if (!active.current) return
          const status = (cause as { status?: number }).status
          if (status === 401) { navigate("/login", { replace: true }); return }
          if (status === 403) { setError("Você não tem permissão para abrir esta notificação."); return }
          toast.warning("Não foi possível registrar a leitura. A notificação continuará como não lida.")
        }
      }
      navigate(notification.targetUrl || fallback)
    } finally {
      busy.current = false
      if (active.current) setOpeningId(null)
    }
  }

  return { notifications, isLoading, loadError, error, setError, isMarkingAll, openingId, markAllAsRead, openNotification, retry: () => setRevision(value => value + 1) }
}
