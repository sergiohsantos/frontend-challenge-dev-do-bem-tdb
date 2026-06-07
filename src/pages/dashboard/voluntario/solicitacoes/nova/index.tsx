import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FilePlus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ClipboardList
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

const procedureTypes = [
  { value: "ortodontia", label: "Ortodontia" },
  { value: "protese", label: "Prótese" },
  { value: "endodontia", label: "Endodontia" },
  { value: "cirurgia", label: "Cirurgia" },
  { value: "restauracao", label: "Restauração" },
  { value: "avaliacao", label: "Avaliação Inicial" },
  { value: "psicologico", label: "Acompanhamento Psicológico" },
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

  // Load user name
  useEffect(() => {
    const user = getUser()
    if (user?.full_name) {
      setUserName(user.full_name)
    }
  }, [])

  // Load volunteer cases
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
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
      
      await apiFetch("/api/volunteers/procedure-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token)
      
      setSuccess(true)
      setTimeout(() => {
        navigate("/dashboard/voluntario/solicitacoes")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <DashboardHeader userName={userName} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center py-12">
              <div className="rounded-full bg-success/10 p-4 mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-xl font-bold mb-2">Solicitação Enviada!</h2>
              <p className="text-muted-foreground text-center mb-4">
                Sua solicitação foi enviada para análise. Você será notificado quando houver uma atualização.
              </p>
              <p className="text-sm text-muted-foreground">Redirecionando...</p>
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
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/dashboard/voluntario/solicitacoes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Nova Solicitação de Procedimento
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados abaixo para solicitar aprovação de um novo procedimento
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Antes de enviar</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecione o beneficiário, descreva o procedimento e explique a justificativa clínica. A solicitação será analisada pela equipe responsável.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilePlus className="h-5 w-5 text-primary" />
                Dados da Solicitação
              </CardTitle>
              <CardDescription>
                Campos marcados com * são obrigatórios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Beneficiary Selection */}
                <div className="space-y-2">
                  <Label htmlFor="beneficiario_id">Beneficiário *</Label>
                  {isLoadingCases ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando seus casos...</span>
                    </div>
                  ) : cases.length > 0 ? (
                    <Select
                      value={formData.beneficiario_id}
                      onValueChange={(value) => handleChange("beneficiario_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o beneficiario" />
                      </SelectTrigger>
                      <SelectContent>
                        {cases.map((c) => {
                          const beneficiaryId = c.beneficiario_id || c.beneficiaryId || c.case_id || c.caseId
                          const beneficiaryName = c.beneficiario || c.beneficiaryName || `Caso #${beneficiaryId}`
                          return (
                            <SelectItem key={beneficiaryId} value={String(beneficiaryId)}>
                              {beneficiaryName} {c.program ? `(${c.program})` : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
                      <p className="text-sm text-warning">
                        {casesLoadError || "Nenhum caso encontrado. Você precisa ter casos atribuídos para criar uma solicitação."}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Obrigatório. Selecione o beneficiário para o qual deseja solicitar o procedimento.
                  </p>
                </div>

                {/* Procedure Type */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Procedimento *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleChange("tipo", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedureTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Obrigatório. Use o tipo mais próximo do procedimento solicitado.
                  </p>
                </div>

                {/* Procedure Name */}
                <div className="space-y-2">
                  <Label htmlFor="procedimento">Nome do Procedimento *</Label>
                  <Input
                    id="procedimento"
                    placeholder="Ex: Instalação de aparelho ortodôntico fixo"
                    value={formData.procedimento}
                    onChange={(e) => handleChange("procedimento", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Obrigatório. Informe um nome claro para facilitar a análise.
                  </p>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade *</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value) => handleChange("prioridade", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Obrigatório. Use "urgente" apenas quando houver necessidade clínica imediata.
                  </p>
                </div>

                {/* Justification */}
                <div className="space-y-2">
                  <Label htmlFor="justificativa">Justificativa Clínica *</Label>
                  <Textarea
                    id="justificativa"
                    placeholder="Descreva a necessidade clínica do procedimento..."
                    value={formData.justificativa}
                    onChange={(e) => handleChange("justificativa", e.target.value)}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Obrigatório. Explique por que o procedimento é necessário para este caso.
                  </p>
                </div>

                {/* Diagnosis */}
                <div className="space-y-2">
                  <Label htmlFor="diagnostico">Diagnóstico</Label>
                  <Textarea
                    id="diagnostico"
                    placeholder="Descreva o diagnóstico clínico..."
                    value={formData.diagnostico}
                    onChange={(e) => handleChange("diagnostico", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Treatment Plan */}
                <div className="space-y-2">
                  <Label htmlFor="plano_tratamento">Plano de Tratamento</Label>
                  <Textarea
                    id="plano_tratamento"
                    placeholder="Descreva o plano de tratamento proposto..."
                    value={formData.plano_tratamento}
                    onChange={(e) => handleChange("plano_tratamento", e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isLoadingCases || cases.length === 0} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Enviar Solicitação
                      </>
                    )}
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
