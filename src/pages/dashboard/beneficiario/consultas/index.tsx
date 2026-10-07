import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BeneficiaryPageHero } from "@/components/dashboard/beneficiary-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { BeneficiaryAppointmentCard, BeneficiaryPastAppointmentCard, AppointmentEmptyState } from "@/components/dashboard/beneficiary-appointment-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, CheckCircle2, AlertCircle, Loader2, MessageSquare, FileText } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface Appointment {
  id: number
  date: string
  time: string
  doctor: string
  specialty: string
  procedureTitle?: string
  approvalRequestId?: string
  address: string
  phone: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled"
  canConfirm?: boolean
  canReschedule?: boolean
  type?: string
}

interface AppointmentsResponse {
  appointments?: Appointment[]
  upcoming?: Appointment[]
  past?: Appointment[]
}

export default function ConsultasPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [userName, setUserName] = useState("...")
  const [requestingAppointmentId, setRequestingAppointmentId] = useState<number | null>(null)
  const [confirmingAppointmentId, setConfirmingAppointmentId] = useState<number | null>(null)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)
  const isPositiveFeedback = error ? /sucesso|confirmada/i.test(error) : false

  useEffect(() => {
    const user = getUser()
    if (user?.full_name) setUserName(user.full_name)
  }, [])

  const loadAppointments = async () => {
    try {
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const data = await apiFetch<AppointmentsResponse & { items?: Appointment[] }>("/api/beneficiaries/me/appointments", {}, token)
      const allAppointments = [...(data.upcoming || []), ...(data.past || []), ...(data.appointments || []), ...(data.items || [])]
      const uniqueAppointments = allAppointments.filter((item, index, array) => array.findIndex((entry) => entry.id === item.id) === index)
      setAppointments(uniqueAppointments)
      setError(null)
    } catch {
      setError("Não foi possível carregar suas consultas agora. Tente novamente em instantes.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [navigate])

  const upcomingAppointments = appointments.filter(a => a.status === "scheduled" || a.status === "confirmed" || a.status === "rescheduled")
  const pastAppointments = appointments.filter(a => a.status === "completed" || a.status === "cancelled")
  const needsConfirmation = upcomingAppointments.filter((item) => item.status === "scheduled" && item.canConfirm !== false).length

  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary" className="rounded-full">Agendada</Badge>
      case "confirmed":
        return <Badge className="rounded-full bg-success text-success-foreground">Confirmada</Badge>
      case "completed":
        return <Badge variant="outline" className="rounded-full">Realizada</Badge>
      case "cancelled":
        return <Badge variant="destructive" className="rounded-full">Cancelada</Badge>
      case "rescheduled":
        return <Badge variant="secondary" className="rounded-full">Reagendamento solicitado</Badge>
      default:
        return null
    }
  }

  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      setConfirmingAppointmentId(appointmentId)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const result = await apiFetch<{ message?: string }>(`/api/beneficiaries/appointments/${appointmentId}/confirm`, { method: "POST" }, token)
      setAppointments((prev) => prev.map((item) => item.id === appointmentId ? { ...item, status: "confirmed" } : item))
      await loadAppointments()
      setError(result.message || "Presença confirmada com sucesso")
    } catch {
      setError("Não foi possível confirmar sua presença agora. Tente novamente em instantes.")
    } finally {
      setConfirmingAppointmentId(null)
    }
  }

  const openRescheduleDialog = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId)
    setRescheduleReason("")
    setRescheduleError(null)
    setRescheduleDialogOpen(true)
  }

  const handleReschedule = async () => {
    const appointmentId = selectedAppointmentId
    const reason = rescheduleReason.trim()
    if (!appointmentId) return
    if (!reason) {
      setRescheduleError("Informe o motivo do reagendamento.")
      return
    }

    try {
      setRequestingAppointmentId(appointmentId)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const result = await apiFetch<{ message?: string }>(`/api/beneficiaries/appointments/${appointmentId}/reschedule-request`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }, token)

      setAppointments((prev) => prev.map((item) => item.id === appointmentId ? { ...item, status: "rescheduled" } : item))
      await loadAppointments()
      setError(result.message || "Solicitação de reagendamento enviada com sucesso")
      setRescheduleDialogOpen(false)
      setSelectedAppointmentId(null)
      setRescheduleReason("")
    } catch {
      setError("Não foi possível solicitar o reagendamento agora. Tente novamente em instantes.")
    } finally {
      setRequestingAppointmentId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={userName} userType="beneficiario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando consultas...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={userName} userType="beneficiario" notificationCount={0} />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <BeneficiaryPageHero
            eyebrow="Consultas"
            title="Veja suas consultas e confirme presença com segurança."
            description="Acompanhe data, horário, local, profissional responsável, orientações e histórico do seu atendimento."
            icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
            primaryAction={(
              <Button size="lg" asChild className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90">
                <Link to="/dashboard/beneficiario/mensagens"><MessageSquare className="mr-2 h-5 w-5" />Mensagens</Link>
              </Button>
            )}
            secondaryAction={(
              <Button size="lg" variant="outline" asChild className="h-14 rounded-full border-primary-foreground/30 bg-transparent text-base font-black text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/dashboard/beneficiario/documentos"><FileText className="mr-2 h-5 w-5" />Documentos</Link>
              </Button>
            )}
            meta={(
              <>
                <span>{upcomingAppointments.length} próxima(s)</span>
                <span>{pastAppointments.length} no histórico</span>
                <span>{needsConfirmation} pendente(s) de confirmação</span>
              </>
            )}
          />

          {error && (
            <div className={`mb-6 flex flex-col gap-3 rounded-2xl border p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${isPositiveFeedback ? "border-success/50 bg-success/10 text-success" : "border-destructive/50 bg-destructive/10 text-destructive"}`}>
              <div className="flex items-center gap-2">
                {isPositiveFeedback ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                <span>{error}</span>
              </div>
              {!isPositiveFeedback && <Button variant="outline" size="sm" className="rounded-full" onClick={() => void loadAppointments()}>Tentar novamente</Button>}
            </div>
          )}

          <Card className="tdb-polished-card mb-6 rounded-[2rem] border-primary/20 bg-primary/5">
            <CardContent className="grid gap-3 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Calendar className="h-5 w-5" /></div>
              <div>
                <p className="font-black text-foreground">Antes da consulta</p>
                <p className="text-sm leading-6 text-muted-foreground">Chegue com antecedência, leve documento com foto, avise se não puder comparecer e mantenha seu telefone disponível.</p>
              </div>
              <Button variant="outline" asChild className="h-10 rounded-full font-bold"><Link to="/dashboard/beneficiario/mensagens">Ver mensagens</Link></Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-muted p-1 sm:w-fit">
              <TabsTrigger value="upcoming" className="gap-2 rounded-full">Próximas ({upcomingAppointments.length})</TabsTrigger>
              <TabsTrigger value="past" className="gap-2 rounded-full">Histórico ({pastAppointments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <AppointmentEmptyState title="Nenhuma consulta agendada" description="Você será notificado quando uma nova consulta for agendada." />
              ) : upcomingAppointments.map((apt) => (
                <BeneficiaryAppointmentCard
                  key={apt.id}
                  appointment={apt}
                  statusBadge={getStatusBadge(apt.status)}
                  confirming={confirmingAppointmentId === apt.id}
                  requesting={requestingAppointmentId === apt.id}
                  onConfirm={() => handleConfirmAppointment(apt.id)}
                  onReschedule={() => openRescheduleDialog(apt.id)}
                />
              ))}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastAppointments.length === 0 ? (
                <AppointmentEmptyState title="Nenhuma consulta no histórico" description="Suas consultas realizadas aparecerão aqui." />
              ) : pastAppointments.map((apt) => (
                <BeneficiaryPastAppointmentCard key={apt.id} appointment={apt} statusBadge={getStatusBadge(apt.status)} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Solicitar reagendamento</DialogTitle>
            <DialogDescription>Informe o motivo para que a equipe avalie uma nova data de consulta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea value={rescheduleReason} onChange={(event) => { setRescheduleReason(event.target.value); setRescheduleError(null) }} placeholder="Explique brevemente o motivo do reagendamento..." className="min-h-[120px] rounded-2xl" />
            {rescheduleError && <p className="text-sm text-destructive">{rescheduleError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setRescheduleDialogOpen(false)} disabled={requestingAppointmentId !== null}>Cancelar</Button>
            <Button className="rounded-full font-black" onClick={() => void handleReschedule()} disabled={requestingAppointmentId !== null || !rescheduleReason.trim()}>
              {requestingAppointmentId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {requestingAppointmentId !== null ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HelpButton />
    </div>
  )
}
