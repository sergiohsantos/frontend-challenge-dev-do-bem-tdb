import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  MessageSquare,
  FileText
} from "lucide-react"
import { LocationIndicator } from "@/components/ui/breadcrumb-nav"
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
    if (user?.full_name) {
      setUserName(user.full_name)
    }
  }, [])

  const loadAppointments = async () => {
    try {
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const data = await apiFetch<AppointmentsResponse & { items?: Appointment[] }>("/api/beneficiaries/me/appointments", {}, token)
      const allAppointments = [
        ...(data.upcoming || []),
        ...(data.past || []),
        ...(data.appointments || []),
        ...(data.items || []),
      ]
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



  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      setConfirmingAppointmentId(appointmentId)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const result = await apiFetch<{ message?: string }>(`/api/beneficiaries/appointments/${appointmentId}/confirm`, {
        method: "POST",
      }, token)

      setAppointments((prev) => prev.map((item) => item.id === appointmentId ? { ...item, status: "confirmed" } : item))
      await loadAppointments()
      setError(result.message || "Presença confirmada com sucesso")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar sua presença agora. Tente novamente em instantes.")
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível solicitar o reagendamento agora. Tente novamente em instantes.")
    } finally {
      setRequestingAppointmentId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
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
    <div className="flex min-h-screen flex-col bg-secondary">
      <DashboardHeader userName={userName} userType="beneficiario" notificationCount={0} />
      
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <LocationIndicator currentPage="Consultas" parentPage="Painel" />

          {/* Back button */}
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/beneficiario">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Minhas Consultas
            </h1>
            <p className="mt-1 text-muted-foreground">
              Acompanhe suas consultas agendadas e historico
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className={`mb-4 flex flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
              isPositiveFeedback
                ? "border-success/50 bg-success/10 text-success"
                : "border-destructive/50 bg-destructive/10 text-destructive"
            }`}>
              <div className="flex items-center gap-2">
                {isPositiveFeedback ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                <span>{error}</span>
              </div>
              {!isPositiveFeedback && (
                <Button variant="outline" size="sm" onClick={() => void loadAppointments()}>
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Antes da consulta</p>
                <p className="text-sm text-muted-foreground">
                  Chegue com antecedência, leve documento com foto, avise se não puder comparecer e mantenha seu telefone disponível.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/dashboard/beneficiario/mensagens">Ver mensagens</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Proximas ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Historico ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Nenhuma consulta agendada</h3>
                    <p className="mt-2 text-muted-foreground">
                      Voce sera notificado quando uma nova consulta for agendada.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                upcomingAppointments.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{apt.doctor}</p>
                              <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                              {(apt.procedureTitle || apt.approvalRequestId) && (
                                <p className="text-sm text-foreground/80">
                                  {apt.procedureTitle || "Procedimento"}
                                  {apt.approvalRequestId ? ` • ${apt.approvalRequestId}` : ""}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{apt.date}</span>
                            <span>as</span>
                            <span className="font-medium">{apt.time}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{apt.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${apt.phone}`} className="hover:text-foreground">
                              {apt.phone}
                            </a>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:min-w-[220px] sm:items-end">
                          {getStatusBadge(apt.status)}
                          {(apt.status === "scheduled" || apt.status === "rescheduled" || apt.status === "confirmed") && (
                            <>
                              {apt.canConfirm !== false && apt.status !== "confirmed" && (
                                <Button size="sm" className="w-full gap-2 bg-success text-success-foreground hover:bg-success/90" onClick={() => handleConfirmAppointment(apt.id)} disabled={confirmingAppointmentId === apt.id}>
                                  <CheckCircle2 className="h-4 w-4" />
                                  {confirmingAppointmentId === apt.id ? "Confirmando..." : "Confirmar presenca"}
                                </Button>
                              )}
                              {apt.canReschedule !== false && (
                                <Button size="sm" variant="outline" className="w-full" onClick={() => openRescheduleDialog(apt.id)} disabled={requestingAppointmentId === apt.id}>
                                  {requestingAppointmentId === apt.id ? "Enviando..." : "Solicitar reagendamento"}
                                </Button>
                              )}
                            </>
                          )}
                          <Button size="sm" variant="outline" className="w-full" asChild>
                            <Link to="/dashboard/beneficiario/mensagens">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Ver mensagens
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" className="w-full" asChild>
                            <Link to="/dashboard/beneficiario/documentos">
                              <FileText className="mr-2 h-4 w-4" />
                              Ver documentos
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
                    <h3 className="mt-4 text-lg font-medium">Nenhuma consulta no historico</h3>
                    <p className="mt-2 text-muted-foreground">
                      Suas consultas realizadas aparecerão aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pastAppointments.map((apt) => (
                  <Card key={apt.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{apt.doctor}</p>
                              <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                              {(apt.procedureTitle || apt.approvalRequestId) && (
                                <p className="text-sm text-foreground/80">
                                  {apt.procedureTitle || "Procedimento"}
                                  {apt.approvalRequestId ? ` • ${apt.approvalRequestId}` : ""}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{apt.date} as {apt.time}</span>
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

      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar reagendamento</DialogTitle>
            <DialogDescription>
              Informe o motivo para que a equipe avalie uma nova data de consulta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={rescheduleReason}
              onChange={(event) => {
                setRescheduleReason(event.target.value)
                setRescheduleError(null)
              }}
              placeholder="Explique brevemente o motivo do reagendamento..."
              className="min-h-[120px]"
            />
            {rescheduleError && <p className="text-sm text-destructive">{rescheduleError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)} disabled={requestingAppointmentId !== null}>
              Cancelar
            </Button>
            <Button onClick={() => void handleReschedule()} disabled={requestingAppointmentId !== null || !rescheduleReason.trim()}>
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
