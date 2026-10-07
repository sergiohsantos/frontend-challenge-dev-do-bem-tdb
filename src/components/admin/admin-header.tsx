import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Bell, Search, User, LogOut, Settings, Menu, Moon, Sun, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { clearAuth, getToken, getUser } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { AdminSidebar } from "./admin-sidebar"

interface AdminHeaderProps {
  onMenuClick?: () => void
}

interface HeaderNotification {
  id: string
  title: string
  message: string
  date: string
  read: boolean
  targetUrl?: string
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { resolvedTheme, setTheme } = useTheme()
  const [adminName, setAdminName] = useState("Administrador")
  const [adminEmail, setAdminEmail] = useState("admin@turmadobem.org.br")
  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [isMarking, setIsMarking] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return
      const data = await apiFetch<{ notifications?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }>("/api/admin/notifications", { cache: "no-store" }, token)
      const items = data.notifications || data.items || []
      setNotifications(items.slice(0, 5).map((item, index) => ({
        id: String(item.id ?? `notification-${index}`),
        title: String(item.title ?? "Notificação"),
        message: String(item.message ?? item.description ?? ""),
        date: String(item.date ?? item.createdAt ?? ""),
        read: Boolean(item.read),
        targetUrl: item.targetUrl ? String(item.targetUrl) : undefined,
      })))
    } catch {
      setNotifications([])
    }
  }, [])

  useEffect(() => {
    const user = getUser()
    if (user?.full_name) setAdminName(user.full_name)
    if ((user as unknown as { email?: string })?.email) setAdminEmail((user as unknown as { email: string }).email)
  }, [])

  useEffect(() => {
    loadNotifications()
    const onFocus = () => loadNotifications()
    window.addEventListener("focus", onFocus)
    const interval = window.setInterval(loadNotifications, 15000)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.clearInterval(interval)
    }
  }, [pathname, loadNotifications])

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const handleLogout = () => {
    clearAuth()
    navigate("/admin/login")
  }

  const handleMarkAllRead = async () => {
    try {
      setIsMarking(true)
      const token = getToken()
      if (!token) return
      await apiFetch("/api/admin/notifications/mark-all-read", { method: "POST" }, token)
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    } finally {
      setIsMarking(false)
    }
  }

  const handleOpenNotification = async (notification: HeaderNotification) => {
    try {
      setOpeningId(notification.id)
      const token = getToken()
      if (token && !notification.read) {
        await apiFetch(`/api/admin/notifications/${encodeURIComponent(notification.id)}/read`, { method: "POST" }, token)
        setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      }
      if (notification.targetUrl) {
        navigate(notification.targetUrl)
      } else {
        navigate('/admin/notificacoes')
      }
    } finally {
      setOpeningId(null)
    }
  }

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AD"

  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/85 px-4 shadow-sm shadow-primary/5 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full lg:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="tdb-admin-mobile-sheet w-72 max-w-[85vw] border-r-0 bg-[#102842] p-0 text-white">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <SheetDescription className="sr-only">Navegue pelas opções do painel administrativo</SheetDescription>
            <AdminSidebar variant="drawer" onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden w-72 sm:block lg:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Buscar beneficiários, voluntários, parceiros..." className="h-10 rounded-full border-border/70 bg-background/80 pl-10 pr-4 shadow-sm" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full">
          {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Alternar tema</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">{unreadCount > 9 ? "9+" : unreadCount}</Badge> : null}
              <span className="sr-only">Notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              <Button variant="ghost" size="sm" className="h-auto rounded-full p-0 text-xs text-primary" onClick={handleMarkAllRead} disabled={isMarking}>
                {isMarking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Marcar todas como lidas"}
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex cursor-pointer flex-col items-start gap-1 rounded-xl p-3" onSelect={(e) => { e.preventDefault(); void handleOpenNotification(notification) }}>
                <div className="flex w-full items-start gap-2">
                  <div className={`mt-1 h-2 w-2 rounded-full ${notification.read ? "bg-muted-foreground/40" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{notification.title}</p>
                      {openingId === notification.id ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            )) : (
              <DropdownMenuItem className="rounded-xl text-muted-foreground">Nenhuma notificação recente</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/notificacoes" className="w-full justify-center rounded-xl text-primary">
                Ver todas as notificações
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 rounded-full pl-2 pr-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-black">{adminName}</span>
                <span className="text-xs text-muted-foreground">Administradora</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{adminName}</span>
                <span className="text-xs font-normal text-muted-foreground">{adminEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl">
              <Link to="/admin/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl">
              <Link to="/admin/mensagens">
                <User className="mr-2 h-4 w-4" />
                Central de mensagens
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-xl text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
