import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { clearAuth } from "@/lib/auth"
import {
  LayoutDashboard,
  MapPin,
  Users,
  Heart,
  UserCheck,
  Building2,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  TrendingUp,
  Smile,
  FileCheck,
  UserRoundCheck,
  ClipboardList,
  MessageSquare,
  BrainCircuit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AdminSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
  variant?: "desktop" | "drawer"
}

const mainNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Triagem", href: "/admin/triagem", icon: ClipboardList },
  { title: "Onboarding", href: "/admin/onboarding", icon: UserRoundCheck },
  { title: "IA Preditiva", href: "/admin/ia-preditiva", icon: BrainCircuit },
  { title: "Análise Regional", href: "/admin/regional", icon: MapPin },
  { title: "Programas", href: "/admin/programas", icon: Heart },
  { title: "Satisfação", href: "/admin/satisfacao", icon: Smile },
]

const managementItems = [
  { title: "Aprovações", href: "/admin/aprovacoes", icon: FileCheck },
  { title: "Parceiros", href: "/admin/parceiros", icon: Building2 },
  { title: "Beneficiários", href: "/admin/beneficiarios", icon: Users },
  { title: "Voluntários", href: "/admin/voluntarios", icon: UserCheck },
]

const systemItems = [
  { title: "Mensagens", href: "/admin/mensagens", icon: MessageSquare },
  { title: "Relatórios", href: "/admin/relatorios", icon: FileBarChart },
  { title: "Configurações", href: "/admin/configuracoes", icon: Settings },
]

export function AdminSidebar({ collapsed, onToggle, onNavigate, variant = "desktop" }: AdminSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const isDrawer = variant === "drawer"
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = collapsed ?? internalCollapsed
  const handleToggle = onToggle ?? (() => setInternalCollapsed((current) => !current))

  const handleLogout = () => {
    clearAuth()
    onNavigate?.()
    navigate("/admin/login")
  }

  const NavLink = ({ item, showLabel = true }: { item: typeof mainNavItems[0] & { badge?: string }; showLabel?: boolean }) => {
    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
    
    const linkContent = (
      <Link
        to={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
          isActive
            ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
            : "text-primary-foreground/78 hover:bg-primary-foreground/10 hover:text-primary-foreground",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {showLabel && !isCollapsed && (
          <span className="flex flex-1 items-center justify-between">
            {item.title}
            {item.badge && <span className="ml-auto rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs font-black text-primary-foreground">{item.badge}</span>}
          </span>
        )}
      </Link>
    )

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "tdb-admin-sidebar relative flex-col overflow-hidden border-r border-primary-foreground/10 bg-primary text-primary-foreground transition-all duration-300 h-dvh max-h-dvh min-h-0 shadow-2xl shadow-primary/20",
          "before:pointer-events-none before:absolute before:-left-20 before:top-10 before:h-56 before:w-56 before:rounded-full before:bg-secondary/50 before:blur-3xl before:content-['']",
          "after:pointer-events-none after:absolute after:-bottom-20 after:right-0 after:h-64 after:w-64 after:rounded-full after:bg-accent/35 after:blur-3xl after:content-['']",
          isDrawer ? "flex w-full" : "hidden shrink-0 lg:flex",
          !isDrawer && (isCollapsed ? "w-16" : "w-64")
        )}
      >
        <div className={cn("relative z-10 flex h-16 items-center border-b border-primary-foreground/10 px-4", isCollapsed && "justify-center px-2")}>
          <Link to="/admin" className="flex items-center gap-2">
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black text-primary-foreground">Turma do Bem</span>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Painel Admin</span>
              </div>
            )}
            {isCollapsed && <span className="text-xl font-black text-accent">TdB</span>}
          </Link>
        </div>

        <ScrollArea className="relative z-10 min-h-0 flex-1 px-3 py-4">
          <nav className="flex flex-col gap-6">
            <div>
              {!isCollapsed && <h3 className="mb-3 px-3 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground/56">Principal</h3>}
              <div className="space-y-1">{mainNavItems.map((item) => <NavLink key={item.href} item={item} />)}</div>
            </div>

            <div className="border-t border-primary-foreground/12 pt-4">
              {!isCollapsed && <h3 className="mb-3 px-3 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground/56">Gestão</h3>}
              <div className="space-y-1">{managementItems.map((item) => <NavLink key={item.href} item={item} />)}</div>
            </div>

            <div className="border-t border-primary-foreground/12 pt-4">
              {!isCollapsed && <h3 className="mb-3 px-3 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground/56">Sistema</h3>}
              <div className="space-y-1">{systemItems.map((item) => <NavLink key={item.href} item={item} />)}</div>
            </div>
          </nav>
        </ScrollArea>

        <div className={cn("relative z-10 shrink-0 space-y-2 border-t border-primary-foreground/10 p-3", isCollapsed && "flex flex-col items-center")}>
          {!isDrawer && (
            <Button variant="ghost" size="sm" onClick={handleToggle} className={cn("w-full justify-start rounded-2xl text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground", isCollapsed && "w-auto justify-center px-2")}>
              <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
              {!isCollapsed && <span className="ml-2">Recolher menu</span>}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className={cn("w-full justify-start rounded-2xl text-destructive-foreground/80 hover:bg-destructive/20 hover:text-destructive-foreground", isCollapsed && "w-auto justify-center px-2")}>
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
