import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import { clearAuth, getToken } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Heart, Menu, Bell, User, LogOut, Settings, HelpCircle, Home, Calendar, MessageSquare, FileText, ClipboardList, CalendarClock } from "lucide-react"

interface DashboardHeaderProps {
  userName: string
  userType: "beneficiario" | "voluntario"
  notificationCount?: number
}

const beneficiarioNav = [
  { href: "/dashboard/beneficiario", label: "Início", icon: Home },
  { href: "/dashboard/beneficiario/consultas", label: "Consultas", icon: Calendar },
  { href: "/dashboard/beneficiario/mensagens", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/beneficiario/documentos", label: "Documentos", icon: FileText },
]

const voluntarioNav = [
  { href: "/dashboard/voluntario", label: "Início", icon: Home },
  { href: "/dashboard/voluntario/pacientes", label: "Pacientes", icon: User },
  { href: "/dashboard/voluntario/agenda", label: "Agenda", icon: Calendar },
  { href: "/dashboard/voluntario/solicitacoes", label: "Solicitações", icon: ClipboardList },
  { href: "/dashboard/voluntario/disponibilidade", label: "Disponibilidade", icon: CalendarClock },
  { href: "/dashboard/voluntario/mensagens", label: "Mensagens", icon: MessageSquare },
]

export function DashboardHeader({ userName, userType, notificationCount = 0 }: DashboardHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [liveNotificationCount, setLiveNotificationCount] = useState(notificationCount)
  const navItems = userType === "beneficiario" ? beneficiarioNav : voluntarioNav
  const dashboardBase = userType === "beneficiario" ? "/dashboard/beneficiario" : "/dashboard/voluntario"

  useEffect(() => {
    setLiveNotificationCount(notificationCount)
  }, [notificationCount])

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const token = getToken()
        if (!token) return
        const endpoint = userType === "beneficiario" ? "/api/beneficiaries/me/notifications" : "/api/volunteers/me/notifications"
        const data = await apiFetch<{ notifications?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }>(endpoint, {
          cache: "no-store",
        }, token)
        const items = data.notifications || data.items || []
        const unread = items.filter((item) => !Boolean(item.read)).length
        setLiveNotificationCount(unread)
      } catch {
        setLiveNotificationCount(notificationCount)
      }
    }

    loadUnreadCount()
    const onFocus = () => loadUnreadCount()
    window.addEventListener("focus", onFocus)
    const interval = window.setInterval(loadUnreadCount, 15000)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.clearInterval(interval)
    }
  }, [notificationCount, pathname, userType])

  const handleLogout = () => {
    clearAuth()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to={dashboardBase} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="hidden text-lg font-bold text-foreground sm:block">Turma do Bem</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:gap-2 lg:px-3"
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-10 w-10" asChild>
            <Link to={`${dashboardBase}/notificacoes`} aria-label="Notificações">
              <Bell className="h-5 w-5" aria-hidden="true" />
              {liveNotificationCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {liveNotificationCount > 9 ? "9+" : liveNotificationCount}
                </span>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden max-w-[100px] truncate text-sm font-medium sm:block">
                  {userName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  {userType === "beneficiario" ? "Beneficiário" : "Voluntário"}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`${dashboardBase}/perfil`} className="flex items-center gap-2">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`${dashboardBase}/configuracoes`} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/faq" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  Ajuda
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2 text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 md:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <SheetDescription className="sr-only">
                Navegue pelas opções do painel
              </SheetDescription>
              <div className="flex h-full flex-col">
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {userType === "beneficiario" ? "Beneficiário" : "Voluntário"}
                      </p>
                    </div>
                  </div>
                </div>
                <nav className="flex-1 p-4">
                  <ul className="space-y-1">
                    {navItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-foreground transition-colors hover:bg-secondary"
                        >
                          <item.icon className="h-5 w-5" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="border-t border-border p-4">
                  <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sair da conta
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
