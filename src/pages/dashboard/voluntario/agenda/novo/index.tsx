import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react"
import { LocationIndicator } from "@/components/ui/breadcrumb-nav"
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

export default function NovaConsultaPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [approvedProcedures, setApprovedProcedures] = useState<ApprovedProcedure[]>([])
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
    if (user?.full_name) {
      setUserName(user.full_name)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login", { replace: true })
          return
        }

        const [patientsData, requestsData] = await Promise.all([
          apiFetch<unknown>("/api/volunteers/my-patients", {}, token),
          apiFetch<unknown>("/api/volunteers/procedure-requests", {}, token),
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

        setPatients(patientsPayload.map((item) => normalizePatient(item as Record<string, unknown>)))
        setApprovedProcedures(
          requestsPayload
            .map((item) => normalizeProcedure(item as Record<string, unknown>))
            .filter((item) => item.status === "aprovado" && item.beneficiaryId > 0 && item.canSchedule !== false)
        )
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
    return approvedProcedures.filter((item) => item.beneficiaryId === Number(formData.patientId))
  }, [approvedProcedures, formData.patientId])

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
    setIsSubmitting(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      await apiFetch("/api/volunteers/appointments", {
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

      setSuccess(true)
      setTimeout(() => {
        navigate("/dashboard/voluntario/agenda")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao agendar consulta")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </main>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h2 className="mt-4 text-xl font-semibold">Consulta agendada!</h2>
              <p className="mt-2 text-muted-foreground">
                A consulta foi agendada com sucesso. Redirecionando...
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <LocationIndicator currentPage="Nova Consulta" parentPage="Agenda" />

          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/voluntario/agenda">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar a agenda
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Agendar Consulta
            </h1>
            <p className="mt-1 text-muted-foreground">
              Selecione o beneficiário e o procedimento já aprovado pelo Admin antes de escolher data e horário.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Dados da Consulta
              </CardTitle>
              <CardDescription>
                A consulta só pode ser vinculada a uma solicitação previamente aprovada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="patient">Paciente *</Label>
                  {patients.length === 0 ? (
                    <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
                      Nenhum paciente encontrado. Você precisa ter pacientes atribuídos.
                    </div>
                  ) : (
                    <Select
                      value={formData.patientId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value, approvalRequestId: "" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approvedProcedure">Procedimento aprovado *</Label>
                  {!formData.patientId ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                      Primeiro selecione o paciente para ver os procedimentos liberados para agendamento.
                    </div>
                  ) : proceduresForSelectedPatient.length === 0 ? (
                    <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
                      Este beneficiário ainda não possui solicitação aprovada. Aguarde a aprovação do Admin para agendar a consulta.
                    </div>
                  ) : (
                    <Select
                      value={formData.approvalRequestId}
                      onValueChange={(value) => {
                        const selected = proceduresForSelectedPatient.find((item) => item.id === value)
                        setFormData(prev => ({ ...prev, approvalRequestId: value, type: selected?.title || prev.type }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o procedimento aprovado" />
                      </SelectTrigger>
                      <SelectContent>
                        {proceduresForSelectedPatient.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.id} • {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Descrição amigável *</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="Ex.: Restauração dente 23"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre a consulta..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p>
                      O beneficiário só pode receber consulta após a aprovação da solicitação correspondente. Isso ajuda a manter o tratamento organizado e auditável.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link to="/dashboard/voluntario/agenda">Cancelar</Link>
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      isSubmitting ||
                      !formData.patientId ||
                      !formData.approvalRequestId ||
                      !formData.date ||
                      !formData.time ||
                      !formData.type
                    }
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Agendar Consulta
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
