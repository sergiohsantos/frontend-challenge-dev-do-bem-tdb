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
  Bell,
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
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Triagem",
    href: "/admin/triagem",
    icon: ClipboardList,
  },
  {
    title: "Onboarding",
    href: "/admin/onboarding",
    icon: UserRoundCheck,
  },
  {
    title: "IA Preditiva",
    href: "/admin/ia-preditiva",
    icon: BrainCircuit,
  },
  {
    title: "Análise Regional",
    href: "/admin/regional",
    icon: MapPin,
  },
  {
    title: "Programas",
    href: "/admin/programas",
    icon: Heart,
  },
  {
    title: "Satisfação",
    href: "/admin/satisfacao",
    icon: Smile,
  },
]

const managementItems = [
  {
    title: "Aprovacoes",
    href: "/admin/aprovacoes",
    icon: FileCheck,
  },
  {
    title: "Parceiros",
    href: "/admin/parceiros",
    icon: Building2,
  },
  {
    title: "Beneficiarios",
    href: "/admin/beneficiarios",
    icon: Users,
  },
  {
    title: "Voluntarios",
    href: "/admin/voluntarios",
    icon: UserCheck,
  },
]

const systemItems = [
  {
    title: "Mensagens",
    href: "/admin/mensagens",
    icon: MessageSquare,
  },
  {
    title: "Relatórios",
    href: "/admin/relatorios",
    icon: FileBarChart,
  },
  {
    title: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
  },
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
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {showLabel && !isCollapsed && (
          <span className="flex flex-1 items-center justify-between">
            {item.title}
            {item.badge && (
              <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                {item.badge}
              </span>
            )}
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
          "tdb-admin-sidebar flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 h-dvh max-h-dvh min-h-0",
          isDrawer ? "flex w-full" : "hidden shrink-0 lg:flex",
          !isDrawer && (isCollapsed ? "w-16" : "w-64")
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          isCollapsed && "justify-center px-2"
        )}>
          <Link to="/admin" className="flex items-center gap-2">
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold text-sidebar-foreground">
                  Turma do Bem
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-primary">
                  Painel Admin
                </span>
              </div>
            )}
            {isCollapsed && (
              <span className="text-xl font-bold text-sidebar-primary">TdB</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="min-h-0 flex-1 px-3 py-4">
          <nav className="flex flex-col gap-6">
            {/* Main Navigation */}
            <div>
              {!isCollapsed && (
                <h3 className="mb-3 px-3 text-sm font-bold uppercase tracking-[0.18em] text-sidebar-foreground">
                  Principal
                </h3>
              )}
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>

            {/* Management */}
            <div className="border-t border-orange-500/70 pt-4">
              {!isCollapsed && (
                <h3 className="mb-3 px-3 text-sm font-bold uppercase tracking-[0.18em] text-sidebar-foreground">
                  Gestão
                </h3>
              )}
              <div className="space-y-1">
                {managementItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>

            {/* System */}
            <div className="border-t border-orange-500/70 pt-4">
              {!isCollapsed && (
                <h3 className="mb-3 px-3 text-sm font-bold uppercase tracking-[0.18em] text-sidebar-foreground">
                  Sistema
                </h3>
              )}
              <div className="space-y-1">
                {systemItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className={cn(
          "shrink-0 border-t border-sidebar-border p-3 space-y-2",
          isCollapsed && "flex flex-col items-center"
        )}>
          {!isDrawer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className={cn(
                "w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isCollapsed && "w-auto justify-center px-2"
              )}
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )} />
              {!isCollapsed && <span className="ml-2">Recolher menu</span>}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-destructive/70 hover:bg-destructive/10 hover:text-destructive",
              isCollapsed && "w-auto justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
