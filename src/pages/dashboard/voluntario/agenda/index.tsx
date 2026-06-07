import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  FilePlus,
  MessageSquare,
} from "lucide-react"
import { LocationIndicator } from "@/components/ui/breadcrumb-nav"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface Appointment {
  id: number
  date?: string
  time?: string
  patientName: string
  patientId?: number
  caseId?: number
  type: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled"
  statusRaw?: string
}

type ViewMode = "day" | "week" | "month"

function normalizeAppointment(raw: Record<string, unknown>): Appointment {
  const statusRaw = raw.statusRaw ? String(raw.statusRaw) : raw.status ? String(raw.status) : "AGENDADA"
  const normalizedStatus = ["scheduled", "confirmed", "completed", "cancelled", "rescheduled"].includes(statusRaw)
    ? (statusRaw as Appointment["status"])
    : statusRaw === "CONFIRMADA"
      ? "confirmed"
      : statusRaw === "REALIZADA"
        ? "completed"
        : statusRaw === "REAGENDADA"
          ? "rescheduled"
          : ["CANCELADA", "FALTA"].includes(statusRaw)
            ? "cancelled"
            : "scheduled"

  return {
    id: Number(raw.id ?? 0),
    date: raw.date ? String(raw.date) : undefined,
    time: raw.time ? String(raw.time) : undefined,
    patientName: String(raw.patientName ?? "Paciente"),
    patientId: raw.patientId ? Number(raw.patientId) : undefined,
    caseId: raw.caseId ? Number(raw.caseId) : undefined,
    type: String(raw.type ?? "Consulta"),
    status: normalizedStatus,
    statusRaw,
  }
}

function getStartOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function getStartOfMonth(date: Date) {
  const copy = new Date(date)
  copy.setDate(1)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function formatRangeLabel(mode: ViewMode, start: Date, end: Date) {
  if (mode === "day") {
    return start.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  if (mode === "month") {
    return start.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    })
  }

  return `${start.toLocaleDateString("pt-BR")} - ${end.toLocaleDateString("pt-BR")}`
}

export default function AgendaPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [userName, setUserName] = useState("...")
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [referenceDate, setReferenceDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  useEffect(() => {
    const user = getUser()
    if (user?.full_name) setUserName(user.full_name)
  }, [])

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login", { replace: true })
          return
        }

        const data = await apiFetch<{ appointments?: unknown[]; schedule?: unknown[]; items?: unknown[] }>("/api/volunteers/schedule", {}, token)
        const source = data.appointments || data.schedule || data.items || []
        setAppointments(source.map((item) => normalizeAppointment(item as Record<string, unknown>)))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar agenda")
      } finally {
        setIsLoading(false)
      }
    }

    loadSchedule()
  }, [navigate])

  const visibleRange = useMemo(() => {
    const start = new Date(referenceDate)
    const end = new Date(referenceDate)

    if (viewMode === "day") {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }

    if (viewMode === "month") {
      const monthStart = getStartOfMonth(referenceDate)
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)
      return { start: monthStart, end: monthEnd }
    }

    const weekStart = getStartOfWeek(referenceDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return { start: weekStart, end: weekEnd }
  }, [referenceDate, viewMode])

  const rangeLabel = useMemo(() => formatRangeLabel(viewMode, visibleRange.start, visibleRange.end), [viewMode, visibleRange.end, visibleRange.start])

  const isCurrentRange = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (viewMode === "day") {
      return visibleRange.start.getTime() === today.getTime()
    }

    if (viewMode === "month") {
      return visibleRange.start.getMonth() === today.getMonth() && visibleRange.start.getFullYear() == today.getFullYear()
    }

    return getStartOfWeek(today).getTime() === visibleRange.start.getTime()
  }, [viewMode, visibleRange.start])

  const visibleAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (!apt.date) return isCurrentRange
      const aptDate = new Date(`${apt.date}T00:00:00`)
      return aptDate >= visibleRange.start && aptDate <= visibleRange.end
    })
  }, [appointments, isCurrentRange, visibleRange.end, visibleRange.start])

  const upcomingAppointments = visibleAppointments.filter((a) => a.status === "scheduled" || a.status === "confirmed" || a.status === "rescheduled")
  const pastAppointments = visibleAppointments.filter((a) => a.status === "completed" || a.status === "cancelled")

  const shiftRange = (direction: -1 | 1) => {
    setReferenceDate((current) => {
      const next = new Date(current)
      if (viewMode === "day") next.setDate(next.getDate() + direction)
      else if (viewMode === "month") next.setMonth(next.getMonth() + direction)
      else next.setDate(next.getDate() + direction * 7)
      next.setHours(0, 0, 0, 0)
      return next
    })
  }

  const resetToToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setReferenceDate(today)
  }

  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary">Agendada</Badge>
      case "confirmed":
        return <Badge className="bg-success text-success-foreground">Confirmada</Badge>
      case "completed":
        return <Badge variant="outline">Realizada</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>
      case "rescheduled":
        return <Badge variant="secondary">Reagendamento solicitado</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando agenda...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <LocationIndicator currentPage="Agenda" parentPage="Painel" />

          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/voluntario">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
          </Button>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Minha Agenda</h1>
              <p className="mt-1 text-muted-foreground">Gerencie suas consultas e horários</p>
            </div>
            <Button asChild>
              <Link to="/dashboard/voluntario/agenda/novo">
                <Plus className="mr-2 h-4 w-4" />
                Nova Consulta
              </Link>
            </Button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Card className="mb-6">
            <CardContent className="space-y-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                  <TabsList>
                    <TabsTrigger value="day">Dia</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="outline" size="sm" onClick={resetToToday}>
                  Hoje
                </Button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" size="sm" onClick={() => shiftRange(-1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {viewMode === "day" ? "Dia anterior" : viewMode === "month" ? "Mês anterior" : "Semana anterior"}
                </Button>
                <span className="text-center text-sm font-medium capitalize sm:text-base">{rangeLabel}</span>
                <Button variant="ghost" size="sm" onClick={() => shiftRange(1)}>
                  {viewMode === "day" ? "Próximo dia" : viewMode === "month" ? "Próximo mês" : "Próxima semana"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">Próximas ({upcomingAppointments.length})</TabsTrigger>
              <TabsTrigger value="past">Histórico ({pastAppointments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Nenhuma consulta neste período</h3>
                    <p className="mt-2 text-muted-foreground">Clique em "Nova Consulta" para agendar um atendimento.</p>
                    <Button className="mt-4" asChild>
                      <Link to="/dashboard/voluntario/agenda/novo">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Consulta
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                upcomingAppointments.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                            {apt.patientName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{apt.patientName}</p>
                            <p className="text-sm text-muted-foreground">{apt.type || "Consulta"}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{apt.date || "-"} às {apt.time || "-"}</span>
                              {getStatusBadge(apt.status)}
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                          {apt.patientId ? (
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/dashboard/voluntario/pacientes/${apt.patientId}`}>
                                <User className="mr-2 h-4 w-4" />
                                Ver paciente
                              </Link>
                            </Button>
                          ) : null}
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/dashboard/voluntario/solicitacoes/nova">
                              <FilePlus className="mr-2 h-4 w-4" />
                              Nova solicitação
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/dashboard/voluntario/mensagens">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Mensagens
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Nenhuma consulta no histórico deste período</h3>
                    <p className="mt-2 text-muted-foreground">Suas consultas realizadas aparecerão aqui.</p>
                  </CardContent>
                </Card>
              ) : (
                pastAppointments.map((apt) => (
                  <Card key={apt.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            {apt.patientName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{apt.patientName}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{apt.date || "-"} às {apt.time || "-"}</span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
