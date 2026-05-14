import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpButton } from "@/components/layout/help-button"
import { StatusCard, StatusBadge } from "@/components/ui/status-card"
import { JourneyTimeline } from "@/components/ui/journey-timeline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { PageContainer, SectionHeader } from "@/components/ui/page-section"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { 
  Calendar, 
  MessageSquare, 
  Bell, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Send,
  FileText,
  Smile,
  HelpCircle,
  Loader2,
  Heart,
  Sparkles,
  Star
} from "lucide-react"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { LocationIndicator } from "@/components/ui/breadcrumb-nav"
import { ContextualHelp } from "@/components/ui/contextual-help"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { apiFetch, type BeneficiaryDashboard } from "@/lib/api"
import { getToken } from "@/lib/auth"

function mapBeneficiaryStatus(status?: string): "pending" | "in-progress" | "completed" | "attention" | "cancelled" {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "completed"
    case "cancelled":
      return "cancelled"
    case "in-progress":
      return "in-progress"
    default:
      return "pending"
  }
}

function mapAppointmentStatus(status?: string): "pending" | "in-progress" | "completed" | "attention" | "cancelled" {
  switch ((status || "").toLowerCase()) {
    case "confirmed":
      return "in-progress"
    case "completed":
      return "completed"
    case "cancelled":
      return "cancelled"
    case "rescheduled":
      return "attention"
    default:
      return "pending"
  }
}


type DashboardAppointment = NonNullable<BeneficiaryDashboard["nextAppointment"]>

function AppointmentPanel({
  appointment,
  compact = false,
  onConfirm,
  onReschedule,
  isRescheduling = false,
}: {
  appointment: DashboardAppointment
  compact?: boolean
  onConfirm?: () => void
  onReschedule?: () => void
  isRescheduling?: boolean
}) {
  return (
    <div className={`rounded-xl border border-border ${compact ? "bg-background p-4" : "bg-muted/50 p-4"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{appointment.doctor}</p>
              <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
            </div>
          </div>
          {(appointment.procedureTitle || appointment.approvalRequestId) && (
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">{appointment.procedureTitle || "Procedimento em análise"}</p>
              {appointment.approvalRequestId && <p className="text-xs text-muted-foreground">Solicitação {appointment.approvalRequestId}</p>}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{appointment.date}</span>
            <span>às</span>
            <span className="font-medium">{appointment.time}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{appointment.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <a href={`tel:${appointment.phone}`} className="hover:text-foreground">{appointment.phone}</a>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 sm:min-w-[220px]">
          <StatusBadge status={mapAppointmentStatus(appointment.status)} />
          {appointment.canConfirm ? (
            <Button className="w-full gap-2 bg-success text-success-foreground hover:bg-success/90" onClick={onConfirm}>
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              Confirmar presença
            </Button>
          ) : appointment.status === "confirmed" ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-md border border-success/20 bg-success/10 px-4 py-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Presença já confirmada
            </div>
          ) : appointment.status === "rescheduled" ? (
            <div className="w-full rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              Reagendamento solicitado. Aguarde a nova data.
            </div>
          ) : null}
          <Button variant="outline" className="w-full gap-2" onClick={onReschedule} disabled={isRescheduling || appointment.canReschedule === false}>
            <Calendar className="h-5 w-5" aria-hidden="true" />
            {isRescheduling ? "Enviando..." : "Reagendar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function BeneficiarioDashboardPage() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<BeneficiaryDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [messageSent, setMessageSent] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingConfirmationAppointment, setPendingConfirmationAppointment] = useState<DashboardAppointment | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isRequestingReschedule, setIsRequestingReschedule] = useState(false)
  const [showSatisfactionDialog, setShowSatisfactionDialog] = useState(false)
  const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null)
  const [satisfactionComment, setSatisfactionComment] = useState("")
  const [isSubmittingSatisfaction, setIsSubmittingSatisfaction] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) {
        navigate("/login")
        return
      }

      const data = await apiFetch<BeneficiaryDashboard>("/api/beneficiaries/me/dashboard", {}, token)
      setDashboardData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // Use API data - show empty state if no data
  const userData = dashboardData
  const journeySteps = dashboardData?.journeySteps?.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    date: s.date,
    status: (s.status === "completed" || s.status === "current" ? s.status : "upcoming") as "completed" | "current" | "upcoming",
  })) || []
  const currentJourneyStep = (() => {
    const currentIndex = journeySteps.findIndex((step) => step.status === "current")
    if (currentIndex >= 0) return currentIndex + 1
    const completedCount = journeySteps.filter((step) => step.status === "completed").length
    return completedCount > 0 ? completedCount : 1
  })()

  const handleSendMessage = async () => {
    const content = message.trim()
    if (!content) return

    try {
      setIsSendingMessage(true)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login")
        return
      }
      if (!userData?.caseId) {
        throw new Error("Nenhum caso disponível para envio de mensagem")
      }

      await apiFetch(`/api/communication/cases/${userData.caseId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, messageType: "TEXT" }),
      }, token)

      setMessageSent(true)
      setMessage("")
      await loadDashboard()
      setTimeout(() => setMessageSent(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleReschedule = async (appointmentId?: number) => {
    if (!appointmentId) return

    const reason = window.prompt("Descreva o motivo do reagendamento:")?.trim()
    if (!reason) return

    try {
      setIsRequestingReschedule(true)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login")
        return
      }

      await apiFetch(`/api/beneficiaries/appointments/${appointmentId}/reschedule-request`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }, token)

      await loadDashboard()
      setError("Solicitação de reagendamento enviada ao voluntário com sucesso.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar reagendamento")
    } finally {
      setIsRequestingReschedule(false)
    }
  }

  const handleSubmitSatisfaction = async () => {
    if (!Number.isInteger(satisfactionScore) || satisfactionScore === null || satisfactionScore < 0 || satisfactionScore > 10) {
      setError("Informe uma nota inteira de 0 a 10 antes de enviar.")
      return
    }

    try {
      setIsSubmittingSatisfaction(true)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login")
        return
      }

      await apiFetch("/api/beneficiaries/me/satisfaction", {
        method: "POST",
        body: JSON.stringify({
          caseId: userData?.satisfaction?.caseId || userData?.caseId,
          score: satisfactionScore,
          comment: satisfactionComment.trim() || undefined,
        }),
      }, token)

      setShowSatisfactionDialog(false)
      setSatisfactionScore(null)
      setSatisfactionComment("")
      await loadDashboard()
      setError("Avaliação registrada com sucesso. Obrigado pelo feedback!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar avaliação")
    } finally {
      setIsSubmittingSatisfaction(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName="..." userType="beneficiario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <PageContainer>
            <DashboardSkeleton />
          </PageContainer>
        </main>
      </div>
    )
  }

  const status = mapBeneficiaryStatus(userData?.status)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={userData?.name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
      
      <main className="flex-1 py-6 lg:py-8">
        <PageContainer>
          {/* Error message */}
          {error && (
            <AlertBanner
              type={error.includes("sucesso") ? "success" : "error"}
              title={error.includes("sucesso") ? "Sucesso" : "Atenção"}
              message={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mb-6"
            />
          )}
          
          {/* Welcome Section with gradient */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-sm">
                  <Heart className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    Olá, {(userData?.name || "Beneficiário").split(" ")[0]}!
                  </h1>
                  <p className="text-muted-foreground">
                    Acompanhe sua jornada na Turma do Bem
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/dashboard/beneficiario/consultas">
                    <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                    Minhas Consultas
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard/beneficiario/mensagens">
                    <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                    Mensagens
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Card de progresso destacado */}
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Progresso do Tratamento
                          <ContextualHelp 
                            content="Este indicador mostra em qual etapa do tratamento você está. Cada etapa será marcada como concluída quando finalizada pelo seu dentista."
                          />
                        </CardTitle>
                        <CardDescription>{userData?.currentStep || "Aguardando atualização"}</CardDescription>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </CardHeader>
                <CardContent>
                  {journeySteps.length > 0 ? (
                    <ProgressIndicator 
                      steps={journeySteps.map(s => ({
                        label: s.title,
                        description: s.description,
                        completed: s.status === "completed",
                        current: s.status === "current",
                      }))}
                      currentStep={currentJourneyStep}
                      variant="compact"
                      className="mt-2"
                    />
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 mt-2">
                      <Smile className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Seu plano de tratamento ainda não possui etapas registradas. Assim que houver atualização clínica, a jornada aparecerá aqui.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Próximas consultas */}
              {((userData?.appointmentsNeedingConfirmation?.length || 0) > 0 || (userData?.appointmentsWithRescheduleRequest?.length || 0) > 0 || userData?.nextAppointment || (userData?.confirmedUpcomingAppointments?.length || 0) > 0) && (
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                        Próximas Consultas
                      </CardTitle>
                      {userData?.appointmentsNeedingConfirmation?.length ? (
                        <StatusBadge status="pending" />
                      ) : userData?.nextAppointment ? (
                        <StatusBadge status={mapAppointmentStatus(userData.nextAppointment.status)} />
                      ) : null}
                    </div>
                    <CardDescription>
                      {userData?.appointmentsNeedingConfirmation?.length
                        ? "Confirme as próximas consultas pendentes abaixo."
                        : (userData?.appointmentsWithRescheduleRequest?.length || 0) > 0
                          ? "Há consultas com pedido de reagendamento aguardando retorno do voluntário."
                          : "Suas próximas consultas confirmadas aparecem em formato resumido."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(userData?.appointmentsNeedingConfirmation || []).map((appointment) => (
                      <AppointmentPanel
                        key={appointment.id}
                        appointment={appointment}
                        onConfirm={() => {
                          setShowConfirmDialog(true)
                          setPendingConfirmationAppointment(appointment)
                        }}
                        onReschedule={() => handleReschedule(appointment.id)}
                        isRescheduling={isRequestingReschedule}
                      />
                    ))}


                    {(userData?.appointmentsWithRescheduleRequest || []).map((appointment) => (
                      <AppointmentPanel
                        key={`reschedule-${appointment.id}`}
                        appointment={appointment}
                        onReschedule={() => handleReschedule(appointment.id)}
                        isRescheduling={isRequestingReschedule}
                      />
                    ))}


                    {(userData?.confirmedUpcomingAppointments || []).length > 0 && (
                      <div className="space-y-3 rounded-xl border border-border/60 bg-background/50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">Consultas já confirmadas</p>
                          <span className="text-xs text-muted-foreground">Acompanhamento</span>
                        </div>
                        <div className="space-y-3">
                          {(userData?.confirmedUpcomingAppointments || []).map((appointment) => (
                            <div key={appointment.id} className="rounded-lg border border-border p-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-medium text-foreground">{appointment.doctor}</p>
                                  <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                                  {(appointment.procedureTitle || appointment.approvalRequestId) && (
                                    <p className="text-sm text-foreground/80">
                                      {appointment.procedureTitle || "Procedimento"}
                                      {appointment.approvalRequestId ? ` • ${appointment.approvalRequestId}` : ""}
                                    </p>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {appointment.date} às {appointment.time}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <ConfirmationDialog
                      open={showConfirmDialog}
                      onOpenChange={setShowConfirmDialog}
                      title="Confirmar presença na consulta"
                      description={pendingConfirmationAppointment ? `Você confirma sua presença na consulta${pendingConfirmationAppointment.procedureTitle ? ` do procedimento ${pendingConfirmationAppointment.procedureTitle}` : ""}${pendingConfirmationAppointment.approvalRequestId ? ` (${pendingConfirmationAppointment.approvalRequestId})` : ""} do dia ${pendingConfirmationAppointment.date} às ${pendingConfirmationAppointment.time}?` : "Confirma sua presença nesta consulta?"}
                      confirmLabel="Sim, confirmar"
                      cancelLabel="Voltar"
                      variant="success"
                      onConfirm={async () => {
                        try {
                          const token = getToken()
                          if (token && pendingConfirmationAppointment?.id) {
                            await apiFetch(`/api/beneficiaries/appointments/${pendingConfirmationAppointment.id}/confirm`, {
                              method: "POST",
                            }, token)
                            await loadDashboard()
                          }
                          setShowConfirmDialog(false)
                          setPendingConfirmationAppointment(null)
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Erro ao confirmar presença")
                          setShowConfirmDialog(false)
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Journey Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smile className="h-5 w-5 text-primary" aria-hidden="true" />
                    Sua Jornada
                  </CardTitle>
                  <CardDescription>
                    Acompanhe o progresso do seu tratamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JourneyTimeline steps={journeySteps} />
                </CardContent>
              </Card>

              {/* Quick Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                    Enviar Mensagem Rápida
                  </CardTitle>
                  <CardDescription>
                    Tem alguma dúvida ou precisa informar algo? Escreva aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messageSent ? (
                    <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4 text-success">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      <span className="font-medium">Mensagem enviada com sucesso!</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Digite sua mensagem aqui..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[100px] text-base"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!message.trim() || isSendingMessage || !userData?.caseId}
                        className="h-11 gap-2"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        {isSendingMessage ? "Enviando..." : "Enviar mensagem"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-primary" aria-hidden="true" />
                    Avaliar experiência
                  </CardTitle>
                  <CardDescription>
                    Sua nota ajuda a Turma do Bem a acompanhar a qualidade do atendimento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userData?.satisfaction?.canSubmit !== false ? (
                    <Button className="w-full gap-2" onClick={() => setShowSatisfactionDialog(true)} disabled={!userData?.caseId}>
                      <Star className="h-4 w-4" aria-hidden="true" />
                      Avaliar atendimento
                    </Button>
                  ) : (
                    <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                      Avaliação registrada com nota {userData?.satisfaction?.latestScore}/10.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reminders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
                    Lembretes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(userData?.reminders || []).length > 0 ? (
                    userData?.reminders?.map((reminder, index) => (
                    <div
                      key={reminder.id ?? `reminder-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                        reminder.type === "appointment" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                      }`}>
                        {reminder.type === "appointment" ? (
                          <Calendar className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{reminder.title}</p>
                        <p className="text-xs text-muted-foreground">{reminder.description}</p>
                      </div>
                    </div>
                  ))
                  ) : (
                    <Empty variant="subtle" className="py-6">
                      <EmptyMedia variant="icon">
                        <Bell className="h-5 w-5" />
                      </EmptyMedia>
                      <EmptyTitle className="text-base">Nenhum lembrete</EmptyTitle>
                      <EmptyDescription>
                        Seus lembretes aparecerão aqui
                      </EmptyDescription>
                    </Empty>
                  )}
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                      Mensagens Recentes
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboard/beneficiario/mensagens">Ver todas</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(userData?.recentMessages || []).length > 0 ? (
                    userData?.recentMessages?.map((msg, index) => (
                    <div
                      key={msg.id ?? `msg-${index}`}
                      className="rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{msg.from || msg.sender}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{msg.date}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{msg.message || msg.content}</p>
                    </div>
                  ))
                  ) : (
                    <Empty variant="subtle" className="py-6">
                      <EmptyMedia variant="icon">
                        <MessageSquare className="h-5 w-5" />
                      </EmptyMedia>
                      <EmptyTitle className="text-base">Nenhuma mensagem</EmptyTitle>
                      <EmptyDescription>
                        Suas conversas aparecerão aqui
                      </EmptyDescription>
                    </Empty>
                  )}
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm">
                      <Phone className="h-7 w-7 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">Precisa de Ajuda?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ligue grátis para nossa central
                    </p>
                    <a 
                      href="tel:08007777766"
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-lg font-bold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      0800 777 7766
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </PageContainer>
      </main>

      <Dialog open={showSatisfactionDialog} onOpenChange={setShowSatisfactionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar atendimento</DialogTitle>
            <DialogDescription>
              Escolha uma nota de 0 a 10 para sua experiência. O comentário é opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 11 }, (_, score) => (
                <Button
                  key={score}
                  type="button"
                  variant={satisfactionScore === score ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setSatisfactionScore(score)}
                >
                  {score}
                </Button>
              ))}
            </div>
            <Textarea
              value={satisfactionComment}
              onChange={(event) => setSatisfactionComment(event.target.value)}
              placeholder="Conte como foi sua experiência, se desejar."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSatisfactionDialog(false)} disabled={isSubmittingSatisfaction}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitSatisfaction} disabled={isSubmittingSatisfaction || satisfactionScore === null}>
              {isSubmittingSatisfaction ? "Enviando..." : "Enviar avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HelpButton />
    </div>
  )
}
