import { type ReactNode, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocationIndicator } from "@/components/ui/breadcrumb-nav"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FilePlus,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Stethoscope,
  User,
} from "lucide-react"

interface Appointment {
  id: number
  appointmentId?: number
  date?: string
  time?: string
  patientName: string
  patientId?: number
  beneficiaryId?: number
  caseId?: number
  type?: string
  program?: string
  specialty?: string
  procedureTitle?: string
  approvalRequestId?: string
  phone?: string
  city?: string
  state?: string
  address?: string
  location?: string
  description?: string
  notes?: string
  confirmation?: string
  rescheduleRequested?: boolean
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled"
  statusRaw?: string
}

type AgendaView = "calendar" | "clinical"
type ClinicalTab = "upcoming" | "past"
type StatusFilter = "all" | "confirmed" | "scheduled" | "rescheduled" | "cancelled" | "completed"

const VIEW_STORAGE_KEY = "tdb-volunteer-agenda-view"

function firstString(...values: unknown[]) {
  const found = values.find((value) => typeof value === "string" && value.trim().length > 0)
  return found ? String(found) : undefined
}

function firstNumber(...values: unknown[]) {
  const found = values.find((value) => value !== undefined && value !== null && !Number.isNaN(Number(value)))
  return found === undefined ? undefined : Number(found)
}

function parseDateKey(date?: string) {
  if (!date) return null
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return null
  const parsed = new Date(year, month - 1, day)
  parsed.setHours(0, 0, 0, 0)
  return parsed
}

function parseAppointmentDateTime(appointment: Pick<Appointment, "date" | "time">) {
  const parsed = parseDateKey(appointment.date)
  if (!parsed) return null
  const [hours, minutes] = (appointment.time || "").split(":").map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  parsed.setHours(hours, minutes, 0, 0)
  return parsed
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getStartOfMonth(date: Date) {
  const copy = new Date(date)
  copy.setDate(1)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function formatDateLong(date?: string | Date) {
  const value = typeof date === "string" ? parseDateKey(date) : date
  if (!value) return "Data não informada"
  return value.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatDateShort(date?: string) {
  const value = parseDateKey(date)
  return value ? value.toLocaleDateString("pt-BR") : "Data não informada"
}

function normalizeAppointment(raw: Record<string, unknown>): Appointment {
  const statusRaw = firstString(raw.statusRaw, raw.status) ?? "AGENDADA"
  const upperStatus = statusRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
  const rescheduleRequested = Boolean(raw.rescheduleRequested ?? raw.reschedulingRequested)
  const normalizedStatus = ["scheduled", "confirmed", "completed", "cancelled", "rescheduled"].includes(statusRaw)
    ? (statusRaw as Appointment["status"])
    : upperStatus === "CONFIRMADA"
      ? "confirmed"
      : ["REALIZADA", "CONCLUIDA", "CONCLUIDO"].includes(upperStatus)
        ? "completed"
        : ["REAGENDADA", "REAGENDAMENTO_SOLICITADO"].includes(upperStatus) || rescheduleRequested
          ? "rescheduled"
          : ["CANCELADA", "CANCELADO", "FALTA"].includes(upperStatus)
            ? "cancelled"
            : "scheduled"

  return {
    id: Number(raw.id ?? raw.appointmentId ?? 0),
    appointmentId: firstNumber(raw.appointmentId, raw.id),
    date: firstString(raw.date, raw.appointmentDate, raw.data),
    time: firstString(raw.time, raw.appointmentTime, raw.hora),
    patientName: firstString(raw.patientName, raw.beneficiaryName, raw.beneficiario, raw.patient) ?? "Paciente",
    patientId: firstNumber(raw.patientId, raw.beneficiaryId, raw.beneficiarioId),
    beneficiaryId: firstNumber(raw.beneficiaryId, raw.patientId, raw.beneficiarioId),
    caseId: firstNumber(raw.caseId),
    type: firstString(raw.type, raw.program, raw.programName, raw.specialty, raw.procedureTitle) ?? "Consulta",
    program: firstString(raw.program, raw.programName, raw.type),
    specialty: firstString(raw.specialty, raw.especialidade),
    procedureTitle: firstString(raw.procedureTitle, raw.procedure, raw.procedimento),
    approvalRequestId: firstString(raw.approvalRequestId, raw.publicId, raw.solicitacao),
    phone: firstString(raw.phone, raw.telefone),
    city: firstString(raw.city, raw.cidade),
    state: firstString(raw.state, raw.uf),
    address: firstString(raw.address, raw.locationAddress),
    location: firstString(raw.location, raw.locationName),
    description: firstString(raw.description, raw.descricao),
    notes: firstString(raw.notes, raw.observations, raw.observacoes),
    confirmation: firstString(raw.confirmation, raw.confirmedAt, raw.confirmationDate),
    rescheduleRequested,
    status: normalizedStatus,
    statusRaw,
  }
}

function getStatusMeta(appointment: Appointment) {
  switch (appointment.status) {
    case "confirmed":
      return {
        label: "Confirmada",
        dot: "bg-emerald-500",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        row: "border-emerald-200",
        attention: null,
      }
    case "completed":
      return {
        label: "Realizada",
        dot: "bg-slate-400",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        row: "border-border",
        attention: null,
      }
    case "cancelled":
      return {
        label: "Cancelada",
        dot: "bg-zinc-400",
        badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
        row: "border-border opacity-75",
        attention: null,
      }
    case "rescheduled":
      return {
        label: "Reagendamento",
        dot: "bg-amber-500",
        badge: "border-amber-200 bg-amber-50 text-amber-800",
        row: "border-amber-200 bg-amber-50/40",
        attention: "Beneficiário solicitou reagendamento",
      }
    default:
      return {
        label: "Agendada",
        dot: "bg-sky-500",
        badge: "border-sky-200 bg-sky-50 text-sky-700",
        row: "border-sky-200 bg-sky-50/30",
        attention: appointment.confirmation ? null : "Aguardando confirmação",
      }
  }
}

function AppointmentStatusBadge({ appointment }: { appointment: Appointment }) {
  const meta = getStatusMeta(appointment)
  return <Badge variant="outline" className={cn("gap-1", meta.badge)}><span className={cn("h-2 w-2 rounded-full", meta.dot)} />{meta.label}</Badge>
}

function canCompleteAppointment(appointment: Appointment) {
  const appointmentDateTime = parseAppointmentDateTime(appointment)
  if (!appointmentDateTime) return false
  return (
    (appointment.status === "scheduled" || appointment.status === "confirmed")
    && appointmentDateTime <= new Date()
  )
}

function AppointmentActions({
  appointment,
  compact = false,
  completing = false,
  onComplete,
}: {
  appointment: Appointment
  compact?: boolean
  completing?: boolean
  onComplete?: (appointment: Appointment) => void
}) {
  const showComplete = canCompleteAppointment(appointment) && Boolean(onComplete)

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
        {showComplete ? (
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            title="Marcar consulta realizada"
            aria-label="Marcar consulta realizada"
            onClick={() => onComplete?.(appointment)}
            disabled={completing}
          >
            {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span className="sr-only">Marcar consulta realizada</span>
          </Button>
        ) : null}
        {appointment.patientId ? (
          <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" title="Ver paciente" aria-label="Ver paciente" asChild>
            <Link to={`/dashboard/voluntario/pacientes/${appointment.patientId}`}>
              <User className="h-4 w-4" />
              <span className="sr-only">Ver paciente</span>
            </Link>
          </Button>
        ) : null}
        <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" title="Nova solicitação" aria-label="Nova solicitação" asChild>
          <Link to="/dashboard/voluntario/solicitacoes/nova">
            <FilePlus className="h-4 w-4" />
            <span className="sr-only">Nova solicitação</span>
          </Link>
        </Button>
        <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" title="Mensagens" aria-label="Mensagens" asChild>
          <Link to="/dashboard/voluntario/mensagens">
            <MessageSquare className="h-4 w-4" />
            <span className="sr-only">Mensagens</span>
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 lg:min-w-[420px] lg:justify-end">
      {showComplete ? (
        <Button
          size="sm"
          variant="outline"
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={() => onComplete?.(appointment)}
          disabled={completing}
        >
          {completing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Consulta realizada
        </Button>
      ) : null}
      {appointment.patientId ? (
        <Button size="sm" variant="outline" asChild>
          <Link to={`/dashboard/voluntario/pacientes/${appointment.patientId}`}>
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
  )
}

function AppointmentItem({
  appointment,
  compact = false,
  completing = false,
  onComplete,
}: {
  appointment: Appointment
  compact?: boolean
  completing?: boolean
  onComplete?: (appointment: Appointment) => void
}) {
  const meta = getStatusMeta(appointment)
  const location = [appointment.city, appointment.state].filter(Boolean).join("/")
  const procedure = appointment.procedureTitle || appointment.program || appointment.specialty || appointment.type || "Consulta"

  return (
    <div className={cn("rounded-lg border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md", meta.row)}>
      <div className={cn("space-y-4", compact ? "p-3" : "p-5")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
              {appointment.patientName.charAt(0) || "P"}
            </div>
            <div className="min-w-0 space-y-2">
              <div>
                <p className="font-semibold text-foreground">{appointment.patientName}</p>
                <p className="text-sm text-muted-foreground">{procedure}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDateShort(appointment.date)} às {appointment.time || "Horário não informado"}
                </span>
                <AppointmentStatusBadge appointment={appointment} />
              </div>
              {(appointment.approvalRequestId || appointment.phone || location || appointment.location || appointment.address) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {appointment.approvalRequestId && <span>Solicitação {appointment.approvalRequestId}</span>}
                  {appointment.phone && (
                    <a href={`tel:${appointment.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {appointment.phone}
                    </a>
                  )}
                  {location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>}
                  {!location && (appointment.location || appointment.address) && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{appointment.location || appointment.address}</span>
                  )}
                </div>
              )}
              {meta.attention && (
                <div className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                  {meta.attention}
                </div>
              )}
            </div>
          </div>
        <AppointmentActions appointment={appointment} compact={compact} completing={completing} onComplete={onComplete} />
        </div>
      </div>
    </div>
  )
}

function ClinicalAppointmentRow({
  appointment,
  completing = false,
  onComplete,
}: {
  appointment: Appointment
  completing?: boolean
  onComplete?: (appointment: Appointment) => void
}) {
  const meta = getStatusMeta(appointment)
  const location = [appointment.city, appointment.state].filter(Boolean).join("/")
  const procedure = appointment.procedureTitle || appointment.program || appointment.specialty || appointment.type || "Consulta"

  return (
    <div className={cn("grid gap-4 border-b px-4 py-4 last:border-b-0 lg:grid-cols-[120px_minmax(0,1.1fr)_minmax(0,1fr)_170px_120px] lg:items-center", meta.attention && "bg-amber-50/50")}>
      <div>
        <p className="text-sm font-semibold text-foreground">{formatDateShort(appointment.date)}</p>
        <p className="text-sm text-muted-foreground">{appointment.time || "Horario nao informado"}</p>
      </div>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{appointment.patientName}</p>
        {(appointment.phone || location) && (
          <p className="truncate text-sm text-muted-foreground">{[appointment.phone, location].filter(Boolean).join(" - ")}</p>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{procedure}</p>
        {appointment.approvalRequestId && <p className="text-xs text-muted-foreground">Solicitacao {appointment.approvalRequestId}</p>}
      </div>
      <div className="space-y-1">
        <AppointmentStatusBadge appointment={appointment} />
        {meta.attention && <p className="text-xs font-medium text-amber-800">{meta.attention}</p>}
      </div>
      <AppointmentActions appointment={appointment} compact completing={completing} onComplete={onComplete} />
    </div>
  )
}

function EmptyPanel({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function CalendarInsight({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
      {detail && <p className="mt-3 text-sm text-muted-foreground">{detail}</p>}
    </div>
  )
}

function buildCalendarDays(month: Date) {
  const start = getStartOfMonth(month)
  const first = new Date(start)
  first.setDate(first.getDate() - first.getDay())

  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)
  end.setDate(end.getDate() + (6 - end.getDay()))

  const days: Date[] = []
  const cursor = new Date(first)
  while (cursor <= end) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function groupByDate(appointments: Appointment[]) {
  return appointments.reduce<Record<string, Appointment[]>>((groups, appointment) => {
    const key = appointment.date || "sem-data"
    groups[key] = [...(groups[key] || []), appointment]
    return groups
  }, {})
}

function sortAppointmentsAsc(a: Appointment, b: Appointment) {
  const dateCompare = (a.date || "").localeCompare(b.date || "")
  if (dateCompare !== 0) return dateCompare
  return (a.time || "").localeCompare(b.time || "")
}

function sortAppointmentsDesc(a: Appointment, b: Appointment) {
  return sortAppointmentsAsc(b, a)
}

export default function AgendaPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [completingAppointmentId, setCompletingAppointmentId] = useState<number | null>(null)
  const [userName, setUserName] = useState("...")
  const [agendaView, setAgendaView] = useState<AgendaView>(() => {
    if (typeof window === "undefined") return "calendar"
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === "clinical" ? "clinical" : "calendar"
  })
  const [clinicalTab, setClinicalTab] = useState<ClinicalTab>("upcoming")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [referenceDate, setReferenceDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  useEffect(() => {
    const user = getUser()
    if (user?.full_name) setUserName(user.full_name)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, agendaView)
    }
  }, [agendaView])

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
      } catch {
        setError("Não foi possível carregar sua agenda agora. Tente novamente em instantes.")
      } finally {
        setIsLoading(false)
      }
    }

    loadSchedule()
  }, [navigate])

  const today = useMemo(() => {
    const value = new Date()
    value.setHours(0, 0, 0, 0)
    return value
  }, [])

  const monthStart = useMemo(() => getStartOfMonth(referenceDate), [referenceDate])
  const monthLabel = useMemo(() => monthStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), [monthStart])
  const calendarDays = useMemo(() => buildCalendarDays(monthStart), [monthStart])
  const appointmentsByDate = useMemo(() => groupByDate(appointments), [appointments])
  const selectedDateKey = toDateKey(selectedDate)
  const selectedAppointments = useMemo(() => [...(appointmentsByDate[selectedDateKey] || [])].sort(sortAppointmentsAsc), [appointmentsByDate, selectedDateKey])

  const currentMonthAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const date = parseDateKey(appointment.date)
      return date && date.getMonth() === monthStart.getMonth() && date.getFullYear() === monthStart.getFullYear()
    })
  }, [appointments, monthStart])

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.status === "scheduled" || appointment.status === "confirmed" || appointment.status === "rescheduled")
      .filter((appointment) => {
        const date = parseDateKey(appointment.date)
        return !date || date >= today
      })
      .sort(sortAppointmentsAsc)
  }, [appointments, today])

  const pastAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.status === "completed" || appointment.status === "cancelled" || (parseDateKey(appointment.date)?.getTime() || Infinity) < today.getTime())
      .sort(sortAppointmentsDesc)
  }, [appointments, today])

  const groupedUpcoming = useMemo(() => groupByDate(upcomingAppointments), [upcomingAppointments])
  const groupedUpcomingKeys = useMemo(() => Object.keys(groupedUpcoming).sort((a, b) => a.localeCompare(b)), [groupedUpcoming])
  const usedStatuses = useMemo(() => Array.from(new Set(appointments.map((appointment) => appointment.status))), [appointments])
  const todayAppointments = useMemo(() => [...(appointmentsByDate[toDateKey(today)] || [])].sort(sortAppointmentsAsc), [appointmentsByDate, today])
  const attentionAppointments = useMemo(() => upcomingAppointments.filter((appointment) => appointment.status === "scheduled" || appointment.status === "rescheduled"), [upcomingAppointments])
  const nextAppointment = upcomingAppointments[0]

  const clinicalBase = clinicalTab === "upcoming" ? upcomingAppointments : pastAppointments
  const clinicalAppointments = useMemo(() => {
    return clinicalBase.filter((appointment) => statusFilter === "all" || appointment.status === statusFilter)
  }, [clinicalBase, statusFilter])

  const clinicalSummary = useMemo(() => ({
    month: currentMonthAppointments.length,
    confirmed: currentMonthAppointments.filter((appointment) => appointment.status === "confirmed").length,
    scheduled: currentMonthAppointments.filter((appointment) => appointment.status === "scheduled").length,
    rescheduled: currentMonthAppointments.filter((appointment) => appointment.status === "rescheduled").length,
    completed: currentMonthAppointments.filter((appointment) => appointment.status === "completed").length,
  }), [currentMonthAppointments])

  const shiftMonth = (direction: -1 | 1) => {
    setReferenceDate((current) => {
      const next = new Date(current)
      next.setMonth(next.getMonth() + direction)
      next.setHours(0, 0, 0, 0)
      return next
    })
  }

  const handleCompleteAppointment = async (appointment: Appointment) => {
    if (!canCompleteAppointment(appointment) || completingAppointmentId) return

    try {
      setCompletingAppointmentId(appointment.id)
      setError(null)

      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const response = await apiFetch<unknown>(
        `/api/volunteers/appointments/${appointment.id}/complete`,
        { method: "POST" },
        token,
      )
      const updated = normalizeAppointment(response as Record<string, unknown>)
      setAppointments((current) => current.map((item) => (item.id === appointment.id ? { ...item, ...updated } : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel marcar a consulta como realizada.")
    } finally {
      setCompletingAppointmentId(null)
    }
  }

  const resetToToday = () => {
    const next = new Date()
    next.setHours(0, 0, 0, 0)
    setReferenceDate(next)
    setSelectedDate(next)
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
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={agendaView} onValueChange={(value) => setAgendaView(value as AgendaView)}>
                <TabsList className="w-full sm:w-fit">
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Calendário
                  </TabsTrigger>
                  <TabsTrigger value="clinical" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Visão clínica
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button variant="outline" size="sm" onClick={resetToToday}>Hoje</Button>
                <div className="flex items-center justify-between gap-2 rounded-lg border bg-background p-1">
                  <Button variant="ghost" size="sm" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[170px] text-center text-sm font-medium capitalize">{monthLabel}</span>
                  <Button variant="ghost" size="sm" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {appointments.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyPanel
                  icon={<Calendar className="h-6 w-6" />}
                  title="Você ainda não possui consultas agendadas."
                  description="Quando houver consultas, elas aparecerão nesta agenda com calendário, status e ações rápidas."
                  action={(
                    <Button asChild>
                      <Link to="/dashboard/voluntario/agenda/novo">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Consulta
                      </Link>
                    </Button>
                  )}
                />
              </CardContent>
            </Card>
          ) : agendaView === "calendar" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <CalendarInsight
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Hoje"
                  value={todayAppointments.length}
                  detail={todayAppointments.length > 0 ? `${todayAppointments.length} consulta${todayAppointments.length === 1 ? "" : "s"} para acompanhar` : "Sem consultas para hoje"}
                />
                <CalendarInsight
                  icon={<Clock className="h-5 w-5" />}
                  label="Próxima consulta"
                  value={nextAppointment?.time || "--:--"}
                  detail={nextAppointment ? `${nextAppointment.patientName} - ${formatDateShort(nextAppointment.date)}` : "Nenhuma próxima consulta"}
                />
                <CalendarInsight
                  icon={<AlertCircle className="h-5 w-5" />}
                  label="Atenção"
                  value={attentionAppointments.length}
                  detail={attentionAppointments.length > 0 ? "Há consultas sem confirmação ou com reagendamento" : "Nenhum ponto crítico na agenda"}
                />
              </div>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <Card className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Calendário mensal</p>
                        <h2 className="text-xl font-semibold capitalize text-foreground">{monthLabel}</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">{currentMonthAppointments.length} consulta{currentMonthAppointments.length === 1 ? "" : "s"} no mês</p>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase text-muted-foreground">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => <div key={day} className="py-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {calendarDays.map((day) => {
                        const key = toDateKey(day)
                        const dayAppointments = appointmentsByDate[key] || []
                        const isCurrentMonth = day.getMonth() === monthStart.getMonth()
                        const selected = isSameDay(day, selectedDate)
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "min-h-[72px] rounded-lg border p-1.5 text-left transition hover:border-primary/50 hover:bg-primary/5 sm:min-h-[118px] sm:p-2.5",
                              !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                              dayAppointments.length > 0 && "border-primary/20 bg-primary/5",
                              selected && "border-primary bg-primary/10",
                              isSameDay(day, today) && !selected && "border-primary/40",
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium", isSameDay(day, today) && "bg-primary text-primary-foreground")}>{day.getDate()}</span>
                              {dayAppointments.length > 1 && <span className="text-xs font-medium text-primary">{dayAppointments.length}</span>}
                            </div>
                            {dayAppointments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="flex flex-wrap gap-1">
                                {dayAppointments.slice(0, 4).map((appointment) => (
                                  <span key={`${appointment.id}-${appointment.status}`} className={cn("h-2 w-2 rounded-full", getStatusMeta(appointment).dot)} />
                                ))}
                                </div>
                                <div className="hidden space-y-1 sm:block">
                                  {dayAppointments.slice(0, 2).map((appointment) => (
                                    <div key={`${appointment.id}-preview`} className="truncate rounded bg-background/80 px-1.5 py-1 text-[11px] text-foreground shadow-sm">
                                      {appointment.time || "--:--"} {appointment.patientName}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {usedStatuses.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {usedStatuses.map((status) => {
                          const sample = appointments.find((appointment) => appointment.status === status)
                          if (!sample) return null
                          const meta = getStatusMeta(sample)
                          return <span key={status} className="inline-flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />{meta.label}</span>
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Dia selecionado</p>
                      <h2 className="text-lg font-semibold capitalize text-foreground">{formatDateLong(selectedDate)}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedAppointments.length} consulta{selectedAppointments.length === 1 ? "" : "s"}</p>
                    </div>
                    {selectedAppointments.length === 0 ? (
                      <EmptyPanel icon={<Calendar className="h-6 w-6" />} title="Dia livre" description="Não há consultas agendadas para este dia." />
                    ) : (
                      <div className="space-y-3">
                        {selectedAppointments.map((appointment) => (
                          <AppointmentItem
                            key={appointment.id}
                            appointment={appointment}
                            compact
                            completing={completingAppointmentId === appointment.id}
                            onComplete={handleCompleteAppointment}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-5">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Próximas consultas</h2>
                    <p className="text-sm text-muted-foreground">Agrupadas por data para facilitar a preparação do atendimento.</p>
                  </div>
                  {groupedUpcomingKeys.length === 0 ? (
                    <EmptyPanel icon={<CalendarDays className="h-6 w-6" />} title="Sem próximas consultas" description="Não há próximas consultas para exibir no momento." />
                  ) : (
                    <div className="space-y-6">
                      {groupedUpcomingKeys.map((key) => (
                        <section key={key} className="space-y-3">
                          <h3 className="text-sm font-semibold capitalize text-foreground">{formatDateLong(key)}</h3>
                          <div className="space-y-3">
                            {groupedUpcoming[key].sort(sortAppointmentsAsc).map((appointment) => (
                              <AppointmentItem
                                key={appointment.id}
                                appointment={appointment}
                                completing={completingAppointmentId === appointment.id}
                                onComplete={handleCompleteAppointment}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Consultas do mês", clinicalSummary.month, <CalendarDays className="h-5 w-5" />],
                  ["Confirmadas", clinicalSummary.confirmed, <CheckCircle2 className="h-5 w-5" />],
                  ["Sem confirmação", clinicalSummary.scheduled, <Clock className="h-5 w-5" />],
                  ["Reagendamentos", clinicalSummary.rescheduled, <AlertCircle className="h-5 w-5" />],
                  ["Histórico", clinicalSummary.completed, <Stethoscope className="h-5 w-5" />],
                ].map(([label, value, icon]) => (
                  <Card key={String(label)}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs value={clinicalTab} onValueChange={(value) => setClinicalTab(value as ClinicalTab)}>
                      <TabsList>
                        <TabsTrigger value="upcoming">Próximas ({upcomingAppointments.length})</TabsTrigger>
                        <TabsTrigger value="past">Histórico ({pastAppointments.length})</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                      <TabsList className="flex h-auto w-full flex-wrap justify-start sm:w-fit">
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="confirmed">Confirmadas</TabsTrigger>
                        <TabsTrigger value="scheduled">Sem confirmação</TabsTrigger>
                        <TabsTrigger value="rescheduled">Reagendamento</TabsTrigger>
                        <TabsTrigger value="completed">Realizadas</TabsTrigger>
                        <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              <Tabs value={clinicalTab} onValueChange={(value) => setClinicalTab(value as ClinicalTab)} className="space-y-4">
                <TabsContent value="upcoming" className="space-y-4">
                  {clinicalAppointments.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Não há próximas consultas para exibir.</h3>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden">
                      <div className="hidden border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid lg:grid-cols-[120px_minmax(0,1.1fr)_minmax(0,1fr)_170px_120px]">
                        <span>Data/hora</span>
                        <span>Beneficiario</span>
                        <span>Procedimento</span>
                        <span>Status</span>
                        <span>Acoes</span>
                      </div>
                      {clinicalAppointments.map((appointment) => (
                        <ClinicalAppointmentRow
                          key={appointment.id}
                          appointment={appointment}
                          completing={completingAppointmentId === appointment.id}
                          onComplete={handleCompleteAppointment}
                        />
                      ))}
                    </Card>
                  )}
                </TabsContent>
                <TabsContent value="past" className="space-y-4">
                  {clinicalAppointments.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Nenhuma consulta no histórico deste filtro</h3>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden">
                      <div className="hidden border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid lg:grid-cols-[120px_minmax(0,1.1fr)_minmax(0,1fr)_170px_120px]">
                        <span>Data/hora</span>
                        <span>Beneficiario</span>
                        <span>Procedimento</span>
                        <span>Status</span>
                        <span>Acoes</span>
                      </div>
                      {clinicalAppointments.map((appointment) => (
                        <ClinicalAppointmentRow
                          key={appointment.id}
                          appointment={appointment}
                          completing={completingAppointmentId === appointment.id}
                          onComplete={handleCompleteAppointment}
                        />
                      ))}
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
