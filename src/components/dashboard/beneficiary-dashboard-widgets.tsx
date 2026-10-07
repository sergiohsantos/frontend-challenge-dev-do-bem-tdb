import { Children, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { StatusBadge } from "@/components/ui/status-card"
import { JourneyTimeline } from "@/components/ui/journey-timeline"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { ContextualHelp } from "@/components/ui/contextual-help"
import { Calendar, CheckCircle2, Clock, FileText, MapPin, MessageSquare, Phone, Send, Smile, Sparkles, Star, User } from "lucide-react"

type JourneyStep = {
  id: string
  title: string
  description: string
  date?: string
  status: "completed" | "current" | "upcoming"
}

type Appointment = {
  id?: number
  doctor?: string
  specialty?: string
  procedureTitle?: string
  approvalRequestId?: string
  date?: string
  time?: string
  address?: string
  phone?: string
  status?: string
  canConfirm?: boolean
  canReschedule?: boolean
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

export function DashboardNextStepCard({ icon, title, description, href }: { icon: ReactNode; title: string; description: string; href: string }) {
  return (
    <Card className="tdb-polished-card mb-6 rounded-[2rem] border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-black">{icon}Meu próximo passo</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-full font-black"><Link to={href}>{title}</Link></Button>
          <Button variant="outline" asChild className="h-11 rounded-full font-bold"><Link to="/dashboard/beneficiario/documentos"><FileText className="mr-2 h-4 w-4" />Ver documentos</Link></Button>
          <Button variant="ghost" asChild className="h-11 rounded-full font-bold"><Link to="/dashboard/beneficiario/mensagens"><MessageSquare className="mr-2 h-4 w-4" />Mensagens</Link></Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardProgressCard({ steps, currentStep, currentLabel, status }: { steps: JourneyStep[]; currentStep: number; currentLabel?: string; status: "pending" | "in-progress" | "completed" | "attention" | "cancelled" }) {
  return (
    <Card className="tdb-polished-card rounded-[2rem] border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 shadow-xl shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10"><Sparkles className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-black">Progresso do tratamento<ContextualHelp content="Este indicador mostra em qual etapa do tratamento você está. Cada etapa será marcada como concluída quando finalizada pelo seu dentista." /></CardTitle>
              <CardDescription>{currentLabel || "Aguardando atualização"}</CardDescription>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>
        {steps.length > 0 ? <ProgressIndicator steps={steps.map(s => ({ label: s.title, description: s.description, completed: s.status === "completed", current: s.status === "current" }))} currentStep={currentStep} variant="compact" className="mt-2" /> : <div className="mt-2 flex items-center gap-3 rounded-2xl bg-muted/50 p-4"><Smile className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Seu plano de tratamento ainda não possui etapas registradas.</p></div>}
      </CardContent>
    </Card>
  )
}

export function DashboardAppointmentPanel({ appointment, onConfirm, onReschedule, isRescheduling }: { appointment: Appointment; onConfirm?: () => void; onReschedule?: () => void; isRescheduling?: boolean }) {
  return (
    <div className="rounded-[2rem] border border-border bg-muted/40 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><User className="h-6 w-6 text-primary" /></div>
            <div><p className="font-black text-foreground">{appointment.doctor}</p><p className="text-sm text-muted-foreground">{appointment.specialty}</p></div>
          </div>
          {(appointment.procedureTitle || appointment.approvalRequestId) && <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm"><p className="font-medium text-foreground">{appointment.procedureTitle || "Procedimento em análise"}</p>{appointment.approvalRequestId && <p className="text-xs text-muted-foreground">Solicitação {appointment.approvalRequestId}</p>}</div>}
          <div className="flex items-center gap-2 text-sm text-foreground"><Clock className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{appointment.date}</span><span>às</span><span className="font-medium">{appointment.time}</span></div>
          {appointment.address && <div className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{appointment.address}</span></div>}
          {appointment.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /><a href={`tel:${appointment.phone}`} className="hover:text-foreground">{appointment.phone}</a></div>}
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:min-w-[220px] sm:items-end">
          <StatusBadge status={mapAppointmentStatus(appointment.status)} />
          {appointment.canConfirm ? <Button className="h-10 w-full rounded-full bg-success font-bold text-success-foreground hover:bg-success/90" onClick={onConfirm}><CheckCircle2 className="mr-2 h-4 w-4" />Confirmar presença</Button> : appointment.status === "confirmed" ? <div className="flex w-full items-center justify-center gap-2 rounded-full border border-success/20 bg-success/10 px-4 py-2 text-sm font-bold text-success"><CheckCircle2 className="h-4 w-4" />Presença já confirmada</div> : appointment.status === "rescheduled" ? <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">Reagendamento solicitado. Aguarde a nova data.</div> : null}
          <Button variant="outline" className="h-10 w-full rounded-full font-bold" onClick={onReschedule} disabled={isRescheduling || appointment.canReschedule === false}><Calendar className="mr-2 h-4 w-4" />{isRescheduling ? "Enviando..." : "Solicitar reagendamento"}</Button>
        </div>
      </div>
    </div>
  )
}

export function DashboardJourneyCard({ steps }: { steps: JourneyStep[] }) {
  return <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black"><Smile className="h-5 w-5 text-primary" />Sua jornada</CardTitle><CardDescription>Acompanhe o progresso do seu tratamento</CardDescription></CardHeader><CardContent><JourneyTimeline steps={steps} /></CardContent></Card>
}

export function QuickMessageCard({ message, setMessage, sent, sending, disabled, onSend }: { message: string; setMessage: (value: string) => void; sent: boolean; sending: boolean; disabled: boolean; onSend: () => void }) {
  return <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black"><MessageSquare className="h-5 w-5 text-primary" />Enviar mensagem rápida</CardTitle><CardDescription>Tem alguma dúvida ou precisa informar algo? Escreva aqui.</CardDescription></CardHeader><CardContent>{sent ? <div className="flex items-center gap-3 rounded-2xl bg-success/10 p-4 text-success"><CheckCircle2 className="h-5 w-5" /><span className="font-bold">Mensagem enviada com sucesso!</span></div> : <div className="space-y-3"><Textarea placeholder="Digite sua mensagem aqui..." value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[100px] rounded-2xl text-base" /><Button onClick={onSend} disabled={disabled || sending} className="h-11 rounded-full font-black"><Send className="mr-2 h-4 w-4" />{sending ? "Enviando..." : "Enviar mensagem"}</Button></div>}</CardContent></Card>
}

export function SidebarListCard({ title, icon, children, emptyTitle, emptyDescription, action }: { title: string; icon: ReactNode; children: ReactNode; emptyTitle: string; emptyDescription: string; action?: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean)
  return <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5"><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg font-black">{icon}{title}</CardTitle>{action}</div></CardHeader><CardContent className="space-y-3">{items.length > 0 ? items : <Empty variant="subtle" className="py-6"><EmptyMedia variant="primary">{icon}</EmptyMedia><EmptyTitle className="text-base">{emptyTitle}</EmptyTitle><EmptyDescription>{emptyDescription}</EmptyDescription></Empty>}</CardContent></Card>
}

export function SatisfactionCard({ canSubmit, canResubmit, latestScore, disabled, onOpen }: { canSubmit?: boolean; canResubmit?: boolean; latestScore?: number | null; disabled?: boolean; onOpen: () => void }) {
  return <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black"><Star className="h-5 w-5 text-primary" />Avaliar experiência</CardTitle><CardDescription>Sua nota ajuda a Turma do Bem a acompanhar a qualidade do atendimento.</CardDescription></CardHeader><CardContent>{canSubmit !== false ? <Button className="h-11 w-full rounded-full font-black" onClick={onOpen} disabled={disabled}><Star className="mr-2 h-4 w-4" />{canResubmit ? "Atualizar avaliação" : "Avaliar atendimento"}</Button> : <div className="rounded-2xl border bg-muted/40 p-3 text-sm text-muted-foreground">Avaliação registrada com nota {latestScore ?? "-"}/10.</div>}</CardContent></Card>
}
