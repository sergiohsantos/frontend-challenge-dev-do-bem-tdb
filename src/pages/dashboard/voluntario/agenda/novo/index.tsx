import { type FormEvent, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerPageHero } from "@/components/dashboard/volunteer-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, AlertCircle, Loader2, CheckCircle2, ClipboardCheck, CalendarPlus, ShieldCheck, UserRoundCheck } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface Patient {
  id: number
  name: string
  beneficiario_id?: number
  beneficiaryId?: number
}

interface ApprovedProcedure {
  id: string
  beneficiaryId: number
  beneficiaryName: string
  title: string
  procedureType?: string
  status: string
  canSchedule?: boolean
}

interface ScheduleAppointment {
  id: number
  patientName: string
  date: string
  time: string
  status: string
}

function normalizePatient(raw: Record<string, unknown>): Patient {
  return {
    id: Number(raw.id ?? raw.beneficiaryId ?? raw.beneficiario_id ?? 0),
    name: String(raw.name ?? raw.nome ?? "Paciente"),
    beneficiario_id: raw.beneficiario_id ? Number(raw.beneficiario_id) : undefined,
    beneficiaryId: raw.beneficiaryId ? Number(raw.beneficiaryId) : undefined,
  }
}

function normalizeProcedure(raw: Record<string, unknown>): ApprovedProcedure {
  return {
    id: String(raw.id ?? raw.public_id ?? ""),
    beneficiaryId: Number(raw.beneficiaryId ?? raw.beneficiary_id ?? 0),
    beneficiaryName: String(raw.beneficiaryName ?? raw.beneficiary_name ?? ((raw.beneficiario as Record<string, unknown> | undefined)?.nome) ?? "Beneficiário"),
    title: String(raw.procedureTitle ?? ((raw.procedimento as Record<string, unknown> | undefined)?.titulo) ?? raw.title ?? "Procedimento"),
    procedureType: raw.procedureType ? String(raw.procedureType) : undefined,
    status: String(raw.status ?? ""),
    canSchedule: raw.canSchedule === undefined ? undefined : Boolean(raw.canSchedule),
  }
}

function normalizeScheduleAppointment(raw: Record<string, unknown>): ScheduleAppointment {
  const rawStatus = String(raw.status ?? raw.statusRaw ?? "scheduled")
  const normalizedStatus = rawStatus.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
  const status = ["CONFIRMADA"].includes(normalizedStatus)
    ? "confirmed"
    : ["REAGENDADA", "REAGENDAMENTO_SOLICITADO"].includes(normalizedStatus)
      ? "rescheduled"
      : ["CANCELADA", "CANCELADO", "FALTA"].includes(normalizedStatus)
        ? "cancelled"
        : ["REALIZADA", "CONCLUIDA", "CONCLUIDO"].includes(normalizedStatus)
          ? "completed"
          : rawStatus.toLowerCase()

  return {
    id: Number(raw.id ?? 0),
    patientName: String(raw.patientName ?? raw.beneficiaryName ?? raw.beneficiario ?? "Paciente"),
    date: String(raw.date ?? ""),
    time: String(raw.time ?? ""),
    status,
  }
}

function appointmentBlocksSchedule(appointment: ScheduleAppointment) {
  return ["scheduled", "confirmed", "rescheduled"].includes(appointment.status.toLowerCase())
}

function buildScheduleConflictMessage(appointment: ScheduleAppointment) {
  return `Conflito de agenda: você já possui uma consulta com ${appointment.patientName} neste dia e horário. Escolha outra data ou horário.`
}

export default function NovaConsultaPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Consulta agendada com sucesso")
  const [patients, setPatients] = useState<Patient[]>([])
  const [approvedProcedures, setApprovedProcedures] = useState<ApprovedProcedure[]>([])
  const [scheduleAppointments, setScheduleAppointments] = useState<ScheduleAppointment[]>([])
  const [userName, setUserName] = useState("...")
  const [formData, setFormData] = useState({
    patientId: "",
    approvalRequestId: "",
    date: "",
    time: "",
    type: "procedimento",
    notes: ""
  })

  useEffect(() => {
    const user = getUser()
    if (user?.full_name) setUserName(user.full_name)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login", { replace: true })
          return
        }

        const [patientsData, requestsData, scheduleData] = await Promise.all([
          apiFetch<unknown>("/api/volunteers/my-patients", {}, token),
          apiFetch<unknown>("/api/volunteers/procedure-requests", {}, token),
          apiFetch<unknown>("/api/volunteers/schedule", {}, token),
        ])

        const patientsPayload = Array.isArray(patientsData)
          ? patientsData
          : patientsData && typeof patientsData === "object" && Array.isArray((patientsData as { patients?: unknown[] }).patients)
            ? (patientsData as { patients: unknown[] }).patients
            : patientsData && typeof patientsData === "object" && Array.isArray((patientsData as { items?: unknown[] }).items)
              ? (patientsData as { items: unknown[] }).items
              : []

        const requestsPayload = Array.isArray(requestsData)
          ? requestsData
          : requestsData && typeof requestsData === "object" && Array.isArray((requestsData as { items?: unknown[] }).items)
            ? (requestsData as { items: unknown[] }).items
            : []

        const schedulePayload = Array.isArray(scheduleData)
          ? scheduleData
          : scheduleData && typeof scheduleData === "object" && Array.isArray((scheduleData as { appointments?: unknown[] }).appointments)
            ? (scheduleData as { appointments: unknown[] }).appointments
            : scheduleData && typeof scheduleData === "object" && Array.isArray((scheduleData as { items?: unknown[] }).items)
              ? (scheduleData as { items: unknown[] }).items
              : scheduleData && typeof scheduleData === "object" && Array.isArray((scheduleData as { schedule?: unknown[] }).schedule)
                ? (scheduleData as { schedule: unknown[] }).schedule
                : []

        setPatients(patientsPayload.map((item) => normalizePatient(item as Record<string, unknown>)))
        setApprovedProcedures(requestsPayload.map((item) => normalizeProcedure(item as Record<string, unknown>)))
        setScheduleAppointments(schedulePayload.map((item) => normalizeScheduleAppointment(item as Record<string, unknown>)))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados para o agendamento")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [navigate])

  const proceduresForSelectedPatient = useMemo(() => {
    if (!formData.patientId) return []
    return approvedProcedures.filter((item) => (
      item.status === "aprovado" &&
      item.beneficiaryId === Number(formData.patientId) &&
      item.canSchedule === true
    ))
  }, [approvedProcedures, formData.patientId])

  const scheduleConflict = useMemo(() => {
    if (!formData.date || !formData.time) return null
    return scheduleAppointments.find((appointment) => (
      appointment.date === formData.date &&
      appointment.time === formData.time &&
      appointmentBlocksSchedule(appointment)
    )) ?? null
  }, [formData.date, formData.time, scheduleAppointments])

  useEffect(() => {
    if (!formData.patientId) return
    if (proceduresForSelectedPatient.length === 0) {
      setFormData((prev) => ({ ...prev, approvalRequestId: "" }))
      return
    }
    if (!proceduresForSelectedPatient.some((item) => item.id === formData.approvalRequestId)) {
      setFormData((prev) => ({
        ...prev,
        approvalRequestId: proceduresForSelectedPatient[0].id,
        type: proceduresForSelectedPatient[0].title,
      }))
    }
  }, [formData.patientId, formData.approvalRequestId, proceduresForSelectedPatient])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (scheduleConflict) {
      setError(buildScheduleConflictMessage(scheduleConflict))
      return
    }
    setIsSubmitting(true)

    try {
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const response = await apiFetch<{ message?: string }>("/api/volunteers/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: Number(formData.patientId),
          approvalRequestId: formData.approvalRequestId,
          date: formData.date,
          time: formData.time,
          type: formData.type,
          notes: formData.notes,
        }),
      }, token)

      setSuccessMessage(response.message || "Agendamento concluído com sucesso")
      setSuccess(true)
      setTimeout(() => navigate("/dashboard/voluntario/agenda"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao agendar consulta")
    } finally {
      setIsSubmitting(false)
    }
  }

  const approvedReadyCount = approvedProcedures.filter((item) => item.status === "aprovado" && item.canSchedule === true).length

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados do agendamento...</p>
          </div>
        </main>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="tdb-polished-card mx-auto max-w-md rounded-[2rem] text-center shadow-2xl shadow-primary/10">
            <CardContent className="py-12">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h2 className="mt-4 text-2xl font-black text-foreground">Agendamento atualizado</h2>
              <p className="mt-2 text-muted-foreground">{successMessage}. Redirecionando...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <VolunteerPageHero
            eyebrow="Agendar consulta"
            title="Agende somente procedimentos liberados para atendimento."
            description="Selecione o beneficiário, escolha uma solicitação aprovada e confirme data e horário sem conflitar com sua agenda atual."
            icon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />}
            backTo="/dashboard/voluntario/agenda"
            backLabel="Voltar para agenda"
            meta={(
              <>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{patients.length} paciente(s)</span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{approvedReadyCount} procedimento(s) liberados</span>
              </>
            )}
          />

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="space-y-4">
              <Card className="tdb-polished-card rounded-[2rem] border-primary/20 bg-primary/5">
                <CardContent className="space-y-3 p-5 text-sm leading-7 text-muted-foreground">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-success" />
                    <p>A consulta só pode ser vinculada a uma solicitação previamente aprovada.</p>
                  </div>
                  <div className="flex gap-3">
                    <UserRoundCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <p>O beneficiário selecionado determina quais procedimentos liberados aparecem para agendamento.</p>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-black">
                  <Calendar className="h-6 w-6 text-primary" />
                  Dados da consulta
                </CardTitle>
                <CardDescription>Revise as informações antes de confirmar o agendamento.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="patient">Paciente *</Label>
                    {patients.length === 0 ? (
                      <div className="rounded-2xl border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
                        Nenhum paciente encontrado. Você precisa ter pacientes atribuídos.
                      </div>
                    ) : (
                      <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value, approvalRequestId: "" }))}>
                        <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                        <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approvedProcedure">Procedimento aprovado *</Label>
                    {!formData.patientId ? (
                      <div className="rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Primeiro selecione o paciente para ver os procedimentos liberados para agendamento.</div>
                    ) : proceduresForSelectedPatient.length === 0 ? (
                      <div className="rounded-2xl border border-warning/50 bg-warning/10 p-3 text-sm text-warning">Não há procedimentos aprovados disponíveis para agendamento deste beneficiário.</div>
                    ) : (
                      <Select value={formData.approvalRequestId} onValueChange={(value) => { const selected = proceduresForSelectedPatient.find((item) => item.id === value); setFormData(prev => ({ ...prev, approvalRequestId: value, type: selected?.title || prev.type })) }}>
                        <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecione o procedimento aprovado" /></SelectTrigger>
                        <SelectContent>{proceduresForSelectedPatient.map((item) => <SelectItem key={item.id} value={item.id}>{item.id} • {item.title}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="date">Data *</Label><Input id="date" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} required className="h-11 rounded-2xl" /></div>
                    <div className="space-y-2"><Label htmlFor="time">Horário *</Label><Input id="time" type="time" value={formData.time} onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} required className="h-11 rounded-2xl" /></div>
                  </div>

                  {scheduleConflict && <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{buildScheduleConflictMessage(scheduleConflict)}</span></div>}

                  <div className="space-y-2"><Label htmlFor="type">Descrição amigável *</Label><Input id="type" value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} placeholder="Ex.: restauração dente 23" required className="h-11 rounded-2xl" /></div>
                  <div className="space-y-2"><Label htmlFor="notes">Observações</Label><Textarea id="notes" placeholder="Informações adicionais sobre a consulta..." value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="rounded-2xl" /></div>

                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground"><div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 h-4 w-4 text-primary" /><p>Esse vínculo ajuda a manter tratamento, aprovação e agendamento conectados no histórico do caso.</p></div></div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" variant="outline" className="h-11 rounded-full sm:flex-1" onClick={() => navigate("/dashboard/voluntario/agenda")}>Cancelar</Button>
                    <Button type="submit" className="h-11 rounded-full font-black sm:flex-1" disabled={isSubmitting || !formData.patientId || !formData.approvalRequestId || !formData.date || !formData.time || !formData.type || Boolean(scheduleConflict)}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Agendar consulta
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
