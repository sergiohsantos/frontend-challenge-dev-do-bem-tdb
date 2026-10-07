import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, CheckCircle2, Clock, FileText, MapPin, MessageSquare, Phone, User } from "lucide-react"

export interface BeneficiaryAppointmentCardItem {
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

interface AppointmentCardProps {
  appointment: BeneficiaryAppointmentCardItem
  statusBadge: ReactNode
  confirming?: boolean
  requesting?: boolean
  onConfirm?: () => void
  onReschedule?: () => void
}

export function BeneficiaryAppointmentCard({ appointment, statusBadge, confirming, requesting, onConfirm, onReschedule }: AppointmentCardProps) {
  return (
    <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-black text-foreground">{appointment.doctor}</p>
                <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                {(appointment.procedureTitle || appointment.approvalRequestId) && (
                  <p className="text-sm text-foreground/80">
                    {appointment.procedureTitle || "Procedimento"}{appointment.approvalRequestId ? ` • ${appointment.approvalRequestId}` : ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.date}</span>
              <span>às</span>
              <span className="font-medium">{appointment.time}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{appointment.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a href={`tel:${appointment.phone}`} className="hover:text-foreground">{appointment.phone}</a>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:ml-6 lg:w-56 lg:flex-col lg:items-stretch">
            <div className="flex lg:justify-end">{statusBadge}</div>
            {(appointment.status === "scheduled" || appointment.status === "rescheduled" || appointment.status === "confirmed") && (
              <>
                {appointment.canConfirm !== false && appointment.status !== "confirmed" && onConfirm && (
                  <Button size="sm" className="h-10 w-full rounded-full bg-success font-bold text-success-foreground hover:bg-success/90" onClick={onConfirm} disabled={confirming}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />{confirming ? "Confirmando..." : "Confirmar presença"}
                  </Button>
                )}
                {appointment.canReschedule !== false && onReschedule && (
                  <Button size="sm" variant="outline" className="h-10 w-full rounded-full font-bold" onClick={onReschedule} disabled={requesting}>{requesting ? "Enviando..." : "Solicitar reagendamento"}</Button>
                )}
              </>
            )}
            <Button size="sm" variant="outline" className="h-10 w-full rounded-full font-bold" asChild><Link to="/dashboard/beneficiario/mensagens"><MessageSquare className="mr-2 h-4 w-4" />Mensagens</Link></Button>
            <Button size="sm" variant="ghost" className="h-10 w-full rounded-full font-bold" asChild><Link to="/dashboard/beneficiario/documentos"><FileText className="mr-2 h-4 w-4" />Documentos</Link></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BeneficiaryPastAppointmentCard({ appointment, statusBadge }: Pick<AppointmentCardProps, "appointment" | "statusBadge">) {
  return (
    <Card className="tdb-polished-card rounded-[2rem] opacity-80 shadow-xl shadow-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"><User className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="font-black text-foreground">{appointment.doctor}</p>
                <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                {(appointment.procedureTitle || appointment.approvalRequestId) && <p className="text-sm text-foreground/80">{appointment.procedureTitle || "Procedimento"}{appointment.approvalRequestId ? ` • ${appointment.approvalRequestId}` : ""}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /><span>{appointment.date} às {appointment.time}</span></div>
          </div>
          {statusBadge}
        </div>
      </CardContent>
    </Card>
  )
}

export function AppointmentEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="tdb-polished-card rounded-[2rem]">
      <CardContent className="py-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-black">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
