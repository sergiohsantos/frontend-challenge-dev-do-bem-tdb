import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BeneficiaryPageHero } from "@/components/dashboard/beneficiary-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Calendar, MessageSquare, Bell, CheckCircle2, FileText, Heart, Loader2, Phone, Sparkles } from "lucide-react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { apiFetch, type BeneficiaryDashboard } from "@/lib/api"
import { getToken } from "@/lib/auth"
import {
  DashboardAppointmentPanel,
  DashboardJourneyCard,
  DashboardNextStepCard,
  DashboardProgressCard,
  QuickMessageCard,
  SatisfactionCard,
  SidebarListCard,
} from "@/components/dashboard/beneficiary-dashboard-widgets"

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

type DashboardAppointment = NonNullable<BeneficiaryDashboard["nextAppointment"]>

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
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<number | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)
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
    } catch {
      setError("Não foi possível carregar seu painel agora. Tente novamente em instantes.")
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const userData = dashboardData
  const journeySteps = dashboardData?.journeySteps?.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    date: s.date,
    status: (s.status === "completed" || s.status === "current" ? s.status : "upcoming") as "completed" | "current" | "upcoming",
  })) || []
  const fallbackJourneySteps = [
    { id: "cadastro", title: "Cadastro recebido", description: "Aguardando validação das informações.", status: "current" as const },
    { id: "documentos", title: "Documentos", description: "Aguardando documentos ou validação.", status: "upcoming" as const },
    { id: "triagem", title: "Triagem", description: "Caso em acompanhamento pela equipe.", status: "upcoming" as const },
    { id: "voluntario", title: "Voluntário indicado", description: "Aguardando indicação ou atualização.", status: "upcoming" as const },
    { id: "consulta", title: "Consulta agendada", description: "Aguardando agendamento.", status: "upcoming" as const },
    { id: "atendimento", title: "Atendimento iniciado", description: "Aguardando evolução clínica.", status: "upcoming" as const },
    { id: "conclusao", title: "Tratamento concluído", description: "Aguardando conclusão do caso.", status: "upcoming" as const },
  ]
  const displayJourneySteps = journeySteps.length > 0 ? journeySteps : fallbackJourneySteps
  const currentJourneyStep = (() => {
    const currentIndex = displayJourneySteps.findIndex((step) => step.status === "current")
    if (currentIndex >= 0) return currentIndex + 1
    const completedCount = displayJourneySteps.filter((step) => step.status === "completed").length
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
      if (!userData?.caseId) throw new Error("Nenhum caso disponível para envio de mensagem")
      await apiFetch(`/api/communication/cases/${userData.caseId}/messages`, { method: "POST", body: JSON.stringify({ content, messageType: "TEXT" }) }, token)
      setMessageSent(true)
      setMessage("")
      await loadDashboard()
      setTimeout(() => setMessageSent(false), 3000)
    } catch {
      setError("Não foi possível enviar a mensagem agora.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const openRescheduleDialog = (appointmentId?: number) => {
    if (!appointmentId) return
    setRescheduleAppointmentId(appointmentId)
    setRescheduleReason("")
    setRescheduleError(null)
  }

  const handleReschedule = async () => {
    const appointmentId = rescheduleAppointmentId
    const reason = rescheduleReason.trim()
    if (!appointmentId) return
    if (!reason) {
      setRescheduleError("Informe o motivo do reagendamento.")
      return
    }
    try {
      setIsRequestingReschedule(true)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login")
        return
      }
      await apiFetch(`/api/beneficiaries/appointments/${appointmentId}/reschedule-request`, { method: "POST", body: JSON.stringify({ reason }) }, token)
      await loadDashboard()
      setError("Solicitação de reagendamento enviada ao voluntário com sucesso.")
      setRescheduleAppointmentId(null)
      setRescheduleReason("")
    } catch {
      setError("Não foi possível solicitar o reagendamento agora.")
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
      await apiFetch("/api/beneficiaries/me/satisfaction", { method: "POST", body: JSON.stringify({ caseId: userData?.satisfaction?.caseId || userData?.caseId, score: satisfactionScore, comment: satisfactionComment.trim() || undefined }) }, token)
      setShowSatisfactionDialog(false)
      setSatisfactionScore(null)
      setSatisfactionComment("")
      await loadDashboard()
      setError("Avaliação registrada com sucesso. Obrigado pelo feedback!")
    } catch {
      setError("Não foi possível registrar sua avaliação agora.")
    } finally {
      setIsSubmittingSatisfaction(false)
    }
  }

  const openSatisfactionDialog = () => {
    setSatisfactionScore(userData?.satisfaction?.latestScore ?? null)
    setSatisfactionComment(userData?.satisfaction?.latestComment ?? "")
    setShowSatisfactionDialog(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName="..." userType="beneficiario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8"><div className="container mx-auto px-4"><DashboardSkeleton /></div></main>
      </div>
    )
  }

  const status = mapBeneficiaryStatus(userData?.status)
  const appointmentToConfirm = userData?.appointmentsNeedingConfirmation?.[0]
  const appointmentToView = appointmentToConfirm || userData?.nextAppointment || userData?.confirmedUpcomingAppointments?.[0]
  const nextStepAction = appointmentToConfirm
    ? { title: "Confirmar presença", description: "Confirme sua consulta para garantir seu atendimento.", href: "/dashboard/beneficiario/consultas", icon: CheckCircle2 }
    : appointmentToView
      ? { title: "Ver consulta", description: "Sua consulta está agendada. Confira data, horário e orientações.", href: "/dashboard/beneficiario/consultas", icon: Calendar }
      : (userData?.recentMessages || []).length > 0
        ? { title: "Ver mensagens", description: "Há comunicação recente sobre o seu atendimento.", href: "/dashboard/beneficiario/mensagens", icon: MessageSquare }
        : { title: "Acompanhar jornada", description: "Seu caso está em acompanhamento. Continue verificando as próximas atualizações.", href: "/dashboard/beneficiario/consultas", icon: Sparkles }
  const NextStepIcon = nextStepAction.icon

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={userData?.name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          {error && <AlertBanner type={error.includes("sucesso") ? "success" : "error"} title={error.includes("sucesso") ? "Sucesso" : "Atenção"} message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}

          <BeneficiaryPageHero
            eyebrow="Meu atendimento"
            title={`Olá, ${(userData?.name || "Beneficiário").split(" ")[0]}!`}
            description="Acompanhe sua jornada na Turma do Bem, veja seu próximo passo e mantenha consultas, documentos e mensagens sempre por perto."
            icon={<Heart className="h-4 w-4" aria-hidden="true" />}
            backTo="/dashboard/beneficiario"
            backLabel="Início"
            primaryAction={<Button size="lg" asChild className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90"><Link to="/dashboard/beneficiario/consultas"><Calendar className="mr-2 h-5 w-5" />Minhas consultas</Link></Button>}
            secondaryAction={<Button size="lg" variant="outline" asChild className="h-14 rounded-full border-primary-foreground/30 bg-transparent text-base font-black text-primary-foreground hover:bg-primary-foreground/10"><Link to="/dashboard/beneficiario/mensagens"><MessageSquare className="mr-2 h-5 w-5" />Mensagens</Link></Button>}
            meta={<><span>{userData?.currentStep || "Em acompanhamento"}</span><span>{displayJourneySteps.length} etapa(s)</span><span>{(userData?.reminders || []).length} lembrete(s)</span></>}
          />

          <DashboardNextStepCard icon={<NextStepIcon className="h-6 w-6 text-primary" />} title={nextStepAction.title} description={nextStepAction.description} href={nextStepAction.href} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <DashboardProgressCard steps={displayJourneySteps} currentStep={currentJourneyStep} currentLabel={userData?.currentStep} status={status} />

              {((userData?.appointmentsNeedingConfirmation?.length || 0) > 0 || (userData?.appointmentsWithRescheduleRequest?.length || 0) > 0 || userData?.nextAppointment || (userData?.confirmedUpcomingAppointments?.length || 0) > 0) && (
                <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                  <CardContent className="space-y-4 p-6">
                    <div><h2 className="flex items-center gap-2 text-lg font-black"><Calendar className="h-5 w-5 text-primary" />Próximas consultas</h2><p className="mt-1 text-sm text-muted-foreground">Acompanhe consultas pendentes, confirmadas e pedidos de reagendamento.</p></div>
                    {(userData?.appointmentsNeedingConfirmation || []).map((appointment) => <DashboardAppointmentPanel key={appointment.id} appointment={appointment} onConfirm={() => { setShowConfirmDialog(true); setPendingConfirmationAppointment(appointment) }} onReschedule={() => openRescheduleDialog(appointment.id)} isRescheduling={isRequestingReschedule} />)}
                    {(userData?.appointmentsWithRescheduleRequest || []).map((appointment) => <DashboardAppointmentPanel key={`reschedule-${appointment.id}`} appointment={appointment} onReschedule={() => openRescheduleDialog(appointment.id)} isRescheduling={isRequestingReschedule} />)}
                    {(userData?.confirmedUpcomingAppointments || []).length > 0 && <div className="space-y-3 rounded-2xl border border-border/60 bg-background/50 p-4"><p className="text-sm font-black text-foreground">Consultas já confirmadas</p>{(userData?.confirmedUpcomingAppointments || []).map((appointment) => <div key={appointment.id} className="rounded-2xl border border-border p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-foreground">{appointment.doctor}</p><p className="text-sm text-muted-foreground">{appointment.specialty}</p></div><div className="text-sm text-muted-foreground">{appointment.date} às {appointment.time}</div></div></div>)}</div>}
                    <ConfirmationDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog} title="Confirmar presença na consulta" description={pendingConfirmationAppointment ? `Você confirma sua presença na consulta${pendingConfirmationAppointment.procedureTitle ? ` do procedimento ${pendingConfirmationAppointment.procedureTitle}` : ""}${pendingConfirmationAppointment.approvalRequestId ? ` (${pendingConfirmationAppointment.approvalRequestId})` : ""} do dia ${pendingConfirmationAppointment.date} às ${pendingConfirmationAppointment.time}?` : "Confirma sua presença nesta consulta?"} confirmLabel="Sim, confirmar" cancelLabel="Voltar" variant="success" onConfirm={async () => { try { const token = getToken(); if (token && pendingConfirmationAppointment?.id) { await apiFetch(`/api/beneficiaries/appointments/${pendingConfirmationAppointment.id}/confirm`, { method: "POST" }, token); await loadDashboard() } setShowConfirmDialog(false); setPendingConfirmationAppointment(null) } catch { setError("Não foi possível confirmar sua presença agora."); setShowConfirmDialog(false) } }} />
                  </CardContent>
                </Card>
              )}

              <DashboardJourneyCard steps={displayJourneySteps} />
              <QuickMessageCard message={message} setMessage={setMessage} sent={messageSent} sending={isSendingMessage} disabled={!message.trim() || !userData?.caseId} onSend={handleSendMessage} />
            </div>

            <div className="space-y-6">
              <SatisfactionCard canSubmit={userData?.satisfaction?.canSubmit} canResubmit={userData?.satisfaction?.canResubmit} latestScore={userData?.satisfaction?.latestScore} disabled={!userData?.caseId} onOpen={openSatisfactionDialog} />
              <SidebarListCard title="Lembretes" icon={<Bell className="h-5 w-5 text-primary" />} emptyTitle="Nenhum lembrete" emptyDescription="Seus lembretes aparecerão aqui">{(userData?.reminders || []).map((reminder, index) => <div key={reminder.id ?? `reminder-${index}`} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3"><div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl ${reminder.type === "appointment" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>{reminder.type === "appointment" ? <Calendar className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</div><div><p className="text-sm font-black text-foreground">{reminder.title}</p><p className="text-xs text-muted-foreground">{reminder.description}</p></div></div>)}</SidebarListCard>
              <SidebarListCard title="Mensagens recentes" icon={<MessageSquare className="h-5 w-5 text-primary" />} emptyTitle="Nenhuma mensagem" emptyDescription="Suas conversas aparecerão aqui" action={<Button variant="ghost" size="sm" asChild className="rounded-full"><Link to="/dashboard/beneficiario/mensagens">Ver todas</Link></Button>}>{(userData?.recentMessages || []).map((msg, index) => <div key={msg.id ?? `msg-${index}`} className="rounded-2xl border border-border bg-card p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-black text-foreground">{msg.from || msg.sender}</p><span className="flex-shrink-0 text-xs text-muted-foreground">{msg.date}</span></div><p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{msg.message || msg.content}</p></div>)}</SidebarListCard>
              <Card className="tdb-polished-card rounded-[2rem] border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"><CardContent className="pt-6"><div className="text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm"><Phone className="h-7 w-7 text-primary" /></div><h3 className="text-lg font-black text-foreground">Precisa de ajuda?</h3><p className="mt-1 text-sm text-muted-foreground">Ligue grátis para nossa central</p><a href="tel:08007777766" className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-lg font-black text-primary transition-colors hover:bg-primary/20"><Phone className="h-4 w-4" />0800 777 7766</a></div></CardContent></Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={rescheduleAppointmentId !== null} onOpenChange={(open) => { if (!open) { setRescheduleAppointmentId(null); setRescheduleError(null) } }}><DialogContent className="max-w-md rounded-[2rem]"><DialogHeader><DialogTitle>Solicitar reagendamento</DialogTitle><DialogDescription>Informe o motivo para que o voluntário e a equipe avaliem uma nova data.</DialogDescription></DialogHeader><div className="space-y-2"><Textarea value={rescheduleReason} onChange={(event) => { setRescheduleReason(event.target.value); setRescheduleError(null) }} placeholder="Explique brevemente o motivo do reagendamento..." className="min-h-[120px] rounded-2xl" />{rescheduleError && <p className="text-sm text-destructive">{rescheduleError}</p>}</div><DialogFooter><Button variant="outline" className="rounded-full" onClick={() => setRescheduleAppointmentId(null)} disabled={isRequestingReschedule}>Cancelar</Button><Button className="rounded-full font-black" onClick={() => void handleReschedule()} disabled={isRequestingReschedule || !rescheduleReason.trim()}>{isRequestingReschedule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isRequestingReschedule ? "Enviando..." : "Enviar solicitação"}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showSatisfactionDialog} onOpenChange={setShowSatisfactionDialog}><DialogContent className="max-w-md rounded-[2rem]"><DialogHeader><DialogTitle>Avaliar atendimento</DialogTitle><DialogDescription>Escolha uma nota de 0 a 10 para sua experiência. O comentário é opcional.</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-6 gap-2">{Array.from({ length: 11 }, (_, score) => <Button key={score} type="button" variant={satisfactionScore === score ? "default" : "outline"} className="h-10 rounded-full" onClick={() => setSatisfactionScore(score)}>{score}</Button>)}</div><Textarea value={satisfactionComment} onChange={(event) => setSatisfactionComment(event.target.value)} placeholder="Conte como foi sua experiência, se desejar." className="min-h-[100px] rounded-2xl" /></div><DialogFooter><Button variant="outline" className="rounded-full" onClick={() => setShowSatisfactionDialog(false)} disabled={isSubmittingSatisfaction}>Cancelar</Button><Button className="rounded-full font-black" onClick={handleSubmitSatisfaction} disabled={isSubmittingSatisfaction || satisfactionScore === null}>{isSubmittingSatisfaction ? "Enviando..." : "Enviar avaliação"}</Button></DialogFooter></DialogContent></Dialog>
      <HelpButton />
    </div>
  )
}
