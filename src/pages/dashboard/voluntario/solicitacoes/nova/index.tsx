import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerPageHero } from "@/components/dashboard/volunteer-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilePlus, Loader2, AlertCircle, CheckCircle2, ClipboardList, ShieldCheck, UserRoundCheck } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

const procedureTypes = [
  { value: "ortodontia", label: "Ortodontia" },
  { value: "protese", label: "Prótese" },
  { value: "endodontia", label: "Endodontia" },
  { value: "cirurgia", label: "Cirurgia" },
  { value: "restauracao", label: "Restauração" },
  { value: "avaliacao", label: "Avaliação inicial" },
  { value: "psicologico", label: "Acompanhamento psicológico" },
  { value: "outro", label: "Outro" },
]

const prioridades = [
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
]

interface VolunteerCase {
  case_id?: number
  caseId?: number
  beneficiario_id?: number
  beneficiaryId?: number
  beneficiario?: string
  beneficiaryName?: string
  program?: string
  status?: string
}

export default function NovaSolicitacaoPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [casesLoadError, setCasesLoadError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userName, setUserName] = useState("...")
  const [cases, setCases] = useState<VolunteerCase[]>([])

  useEffect(() => {
    const user = getUser()
    if (user?.full_name) setUserName(user.full_name)
  }, [])

  useEffect(() => {
    const loadCases = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login", { replace: true })
          return
        }

        const data = await apiFetch<unknown>("/api/volunteers/my-cases", {}, token)
        const payload = Array.isArray(data)
          ? data
          : data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)
            ? (data as { items: unknown[] }).items
            : data && typeof data === "object" && Array.isArray((data as { cases?: unknown[] }).cases)
              ? (data as { cases: unknown[] }).cases
              : []
        setCases(payload as VolunteerCase[])
      } catch {
        setCasesLoadError("Não foi possível carregar seus beneficiários agora. Tente voltar e abrir esta tela novamente em instantes.")
      } finally {
        setIsLoadingCases(false)
      }
    }

    loadCases()
  }, [navigate])

  const [formData, setFormData] = useState({
    beneficiario_id: "",
    tipo: "",
    procedimento: "",
    justificativa: "",
    diagnostico: "",
    plano_tratamento: "",
    prioridade: "normal",
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.tipo || !formData.procedimento || !formData.justificativa) {
      setError("Preencha os campos obrigatórios antes de enviar a solicitação.")
      return
    }

    if (!formData.beneficiario_id && cases.length > 0) {
      setError("Selecione o beneficiário antes de enviar a solicitação.")
      return
    }

    if (!formData.beneficiario_id && cases.length === 0) {
      setError("Você precisa ter um beneficiário atribuído para criar uma solicitação.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const selectedCase = cases.find((item) => String(item.beneficiario_id || item.beneficiaryId || item.case_id || item.caseId) === formData.beneficiario_id)
      const payload = {
        beneficiario_id: parseInt(formData.beneficiario_id),
        caseId: selectedCase?.case_id || selectedCase?.caseId,
        tipo: formData.tipo,
        procedimento: formData.procedimento,
        justificativa: formData.justificativa,
        diagnostico: formData.diagnostico || undefined,
        plano_tratamento: formData.plano_tratamento || undefined,
        prioridade: formData.prioridade,
      }

      await apiFetch("/api/volunteers/procedure-requests", { method: "POST", body: JSON.stringify(payload) }, token)
      setSuccess(true)
      setTimeout(() => navigate("/dashboard/voluntario/solicitacoes"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="tdb-polished-card max-w-md rounded-[2rem] text-center shadow-2xl shadow-primary/10">
            <CardContent className="flex flex-col items-center py-12">
              <div className="mb-4 rounded-full bg-success/10 p-4"><CheckCircle2 className="h-10 w-10 text-success" /></div>
              <h2 className="mb-2 text-2xl font-black text-foreground">Solicitação enviada</h2>
              <p className="mb-4 text-sm leading-7 text-muted-foreground">Sua solicitação foi enviada para análise. Você será notificado quando houver atualização.</p>
              <p className="text-sm text-muted-foreground">Redirecionando...</p>
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
            eyebrow="Nova solicitação"
            title="Solicite aprovação de procedimento com contexto clínico."
            description="Informe o beneficiário, procedimento, justificativa e prioridade para que a equipe TDB avalie o pedido com clareza."
            icon={<FilePlus className="h-4 w-4" aria-hidden="true" />}
            backTo="/dashboard/voluntario/solicitacoes"
            backLabel="Voltar para solicitações"
            meta={(
              <>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{cases.length} caso(s) disponíveis</span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">Justificativa obrigatória</span>
              </>
            )}
          />

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="space-y-4">
              <Card className="tdb-polished-card rounded-[2rem] border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ClipboardList className="h-5 w-5" /></div>
                  <div>
                    <p className="font-black text-foreground">Antes de enviar</p>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">Selecione o beneficiário, descreva o procedimento e explique a justificativa clínica. A solicitação será analisada pela equipe responsável.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="tdb-polished-card rounded-[2rem]">
                <CardContent className="space-y-3 p-5 text-sm leading-6 text-muted-foreground">
                  <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-success" /><p>Use prioridade urgente somente quando houver necessidade clínica imediata.</p></div>
                  <div className="flex gap-3"><UserRoundCheck className="mt-0.5 h-5 w-5 text-primary" /><p>A solicitação fica vinculada ao caso selecionado e ao fluxo administrativo existente.</p></div>
                </CardContent>
              </Card>
            </aside>

            <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-black"><FilePlus className="h-6 w-6 text-primary" />Dados da solicitação</CardTitle>
                <CardDescription>Campos marcados com * são obrigatórios.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="beneficiario_id">Beneficiário *</Label>
                    {isLoadingCases ? (
                      <div className="flex items-center gap-2 rounded-2xl bg-muted/40 p-3"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Carregando seus casos...</span></div>
                    ) : cases.length > 0 ? (
                      <Select value={formData.beneficiario_id} onValueChange={(value) => handleChange("beneficiario_id", value)}>
                        <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecione o beneficiário" /></SelectTrigger>
                        <SelectContent>
                          {cases.map((c) => {
                            const beneficiaryId = c.beneficiario_id || c.beneficiaryId || c.case_id || c.caseId
                            const beneficiaryName = c.beneficiario || c.beneficiaryName || `Caso #${beneficiaryId}`
                            return <SelectItem key={beneficiaryId} value={String(beneficiaryId)}>{beneficiaryName} {c.program ? `(${c.program})` : ""}</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded-2xl border border-warning/50 bg-warning/10 p-3"><p className="text-sm text-warning">{casesLoadError || "Nenhum caso encontrado. Você precisa ter casos atribuídos para criar uma solicitação."}</p></div>
                    )}
                    <p className="text-xs text-muted-foreground">Obrigatório. Selecione o beneficiário para o qual deseja solicitar o procedimento.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de procedimento *</Label>
                      <Select value={formData.tipo} onValueChange={(value) => handleChange("tipo", value)} required>
                        <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>{procedureTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prioridade">Prioridade *</Label>
                      <Select value={formData.prioridade} onValueChange={(value) => handleChange("prioridade", value)}>
                        <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecione a prioridade" /></SelectTrigger>
                        <SelectContent>{prioridades.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="procedimento">Nome do procedimento *</Label>
                    <Input id="procedimento" placeholder="Ex: instalação de aparelho ortodôntico fixo" value={formData.procedimento} onChange={(e) => handleChange("procedimento", e.target.value)} required className="h-11 rounded-2xl" />
                    <p className="text-xs text-muted-foreground">Informe um nome claro para facilitar a análise.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="justificativa">Justificativa clínica *</Label>
                    <Textarea id="justificativa" placeholder="Descreva a necessidade clínica do procedimento..." value={formData.justificativa} onChange={(e) => handleChange("justificativa", e.target.value)} rows={4} required className="rounded-2xl" />
                    <p className="text-xs text-muted-foreground">Explique por que o procedimento é necessário para este caso.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnostico">Diagnóstico</Label>
                    <Textarea id="diagnostico" placeholder="Descreva o diagnóstico clínico..." value={formData.diagnostico} onChange={(e) => handleChange("diagnostico", e.target.value)} rows={3} className="rounded-2xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plano_tratamento">Plano de tratamento</Label>
                    <Textarea id="plano_tratamento" placeholder="Descreva o plano de tratamento proposto..." value={formData.plano_tratamento} onChange={(e) => handleChange("plano_tratamento", e.target.value)} rows={4} className="rounded-2xl" />
                  </div>

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting} className="h-11 rounded-full sm:flex-1">Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting || isLoadingCases || cases.length === 0} className="h-11 flex-1 rounded-full font-black">
                      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><FilePlus className="mr-2 h-4 w-4" />Enviar solicitação</>}
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
