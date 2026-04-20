import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, ArrowLeft, ArrowRight, CheckCircle2, Phone, Info, User, MapPin, FileText, AlertCircle, Key } from "lucide-react"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { ContextualHelp } from "@/components/ui/contextual-help"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { apiFetch, normalizeDigits, normalizeEmail } from "@/lib/api"
import { fetchAddressByCep } from "@/lib/viacep"

// Response type for registration endpoint
interface RegistrationSuccessResponse {
  id: number
  status: string
  message: string
  role: string
  program?: string
  login: string
  temporary_password: string
  next_step: string
}

const steps = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Endereço", icon: MapPin },
  { id: 3, title: "Informações Adicionais", icon: FileText },
]

export default function CadastroBeneficiarioPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [cepFeedback, setCepFeedback] = useState<string | null>(null)
  const [registrationResponse, setRegistrationResponse] = useState<RegistrationSuccessResponse | null>(null)
  const [formData, setFormData] = useState({
    // Step 1
    nomeCompleto: "",
    dataNascimento: "",
    cpf: "",
    rg: "",
    genero: "",
    telefone: "",
    email: "",
    nomeResponsavel: "",
    telefoneResponsavel: "",
    parentesco: "",
    // Step 2
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    endereco: "",
    numero: "",
    complemento: "",
    // Step 3
    escola: "",
    serie: "",
    rendaFamiliar: "",
    comoConheceu: "",
    necessidadesEspeciais: "",
    observacoes: "",
    termos: false,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpa erro ao digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  useEffect(() => {
    const cep = normalizeDigits(formData.cep)
    if (cep.length !== 8) {
      setIsCepLoading(false)
      setCepFeedback(null)
      return
    }

    const controller = new AbortController()
    setIsCepLoading(true)
    setCepFeedback(null)

    fetchAddressByCep(cep, controller.signal)
      .then((address) => {
        if (!address) {
          setCepFeedback("CEP não encontrado. Você pode preencher o endereço manualmente.")
          return
        }

        if (!address.endereco) {
          setCepFeedback("CEP encontrado, mas a rua nÃ£o foi informada. Preencha o endereÃ§o manualmente.")
        }
        setFormData((prev) => ({
          ...prev,
          cep: address.cep,
          estado: address.estado,
          cidade: address.cidade,
          bairro: address.bairro,
          endereco: address.endereco,
        }))
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        setCepFeedback("Não foi possível consultar o CEP agora. Você pode continuar preenchendo manualmente.")
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsCepLoading(false)
        }
      })

    return () => controller.abort()
  }, [formData.cep])

  // Heurística 3: Prevenção de Erros - Validação antes de avançar
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.nomeCompleto.trim()) newErrors.nomeCompleto = "Nome é obrigatório"
      if (!formData.dataNascimento) newErrors.dataNascimento = "Data de nascimento é obrigatória"
      if (!formData.genero) newErrors.genero = "Gênero é obrigatório"
      if (!formData.cpf.trim()) newErrors.cpf = "CPF é obrigatório"
      if (!formData.telefone.trim()) newErrors.telefone = "Telefone é obrigatório"
      if (!formData.nomeResponsavel.trim()) newErrors.nomeResponsavel = "Nome do responsável é obrigatório"
      if (!formData.telefoneResponsavel.trim()) newErrors.telefoneResponsavel = "Telefone do responsável é obrigatório"
      if (!formData.parentesco) newErrors.parentesco = "Parentesco é obrigatório"
    }
    
    if (step === 2) {
      if (!formData.cep.trim()) newErrors.cep = "CEP é obrigatório"
      if (!formData.estado.trim()) newErrors.estado = "Estado é obrigatório"
      if (!formData.cidade.trim()) newErrors.cidade = "Cidade é obrigatória"
      if (!formData.bairro.trim()) newErrors.bairro = "Bairro é obrigatório"
      if (!formData.endereco.trim()) newErrors.endereco = "Endereço é obrigatório"
      if (!formData.numero.trim()) newErrors.numero = "Número é obrigatório"
    }

    if (step === 3) {
      if (!formData.rendaFamiliar) newErrors.rendaFamiliar = "Renda familiar mensal é obrigatória"
      if (!formData.termos) newErrors.termos = "Você deve aceitar os termos"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep(currentStep)) {
      setShowSubmitDialog(true)
    }
  }

  const confirmSubmit = async () => {
    setShowSubmitDialog(false)
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Prepare payload with normalized values
      const payload = {
        ...formData,
        cpf: normalizeDigits(formData.cpf),
        telefone: normalizeDigits(formData.telefone),
        telefoneResponsavel: normalizeDigits(formData.telefoneResponsavel),
        cep: normalizeDigits(formData.cep),
        email: formData.email ? normalizeEmail(formData.email) : undefined,
      }
      
      const response = await apiFetch<RegistrationSuccessResponse>("/api/beneficiaries/registrations", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      
      setRegistrationResponse(response)
      setCurrentStep(4) // Success state
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar cadastro. Tente novamente.")
      setCurrentStep(3) // Go back to last step to show error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary py-6 sm:py-8 lg:py-12">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link 
            to="/"
            className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:mb-6 sm:min-h-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para o início
          </Link>

          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="mb-6 text-center sm:mb-8">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary sm:mb-4 sm:h-16 sm:w-16">
                <Heart className="h-6 w-6 text-primary-foreground sm:h-8 sm:w-8" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Cadastro de Beneficiário
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
                Preencha o formulário abaixo para participar da Turma do Bem.
                Se precisar de ajuda, peça a um adulto.
              </p>
            </div>

            {/* Help Banner */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:mb-6 sm:gap-3 sm:rounded-xl sm:p-4">
              <Phone className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" aria-hidden="true" />
              <p className="text-xs text-foreground sm:text-sm">
                Precisa de ajuda para preencher? Ligue grátis: <strong>0800 777 7766</strong>
              </p>
            </div>

            {/* Heurística 1: Visibilidade do Status - Progress Steps melhorado */}
            {currentStep < 4 && (
              <div className="mb-6 sm:mb-8">
                <ProgressIndicator
                  steps={steps.map((s) => ({
                    label: s.title,
                    completed: currentStep > s.id,
                    current: currentStep === s.id,
                  }))}
                  currentStep={currentStep}
                  variant="compact"
                />
                {/* Indicador textual para acessibilidade */}
                <p className="mt-2 text-center text-xs text-muted-foreground sm:mt-3 sm:text-sm" role="status" aria-live="polite">
                  Etapa {currentStep} de {steps.length}: {steps[currentStep - 1].title}
                </p>
              </div>
            )}

            {/* Form Card */}
            <Card>
              <CardHeader>
                {currentStep < 4 && (
                  <>
                    <CardTitle>
                      Etapa {currentStep}: {steps[currentStep - 1].title}
                    </CardTitle>
                    <CardDescription>
                      {currentStep === 1 && "Informe os dados do jovem que será beneficiado."}
                      {currentStep === 2 && "Informe o endereço de residência."}
                      {currentStep === 3 && "Informações complementares para o cadastro."}
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Personal Data */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="nomeCompleto" className="text-base">
                          Nome completo do jovem *
                        </Label>
                        <Input
                          id="nomeCompleto"
                          placeholder="Digite o nome completo"
                          value={formData.nomeCompleto}
                          onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                          className={`h-12 text-base ${errors.nomeCompleto ? "border-destructive" : ""}`}
                          required
                          aria-describedby={errors.nomeCompleto ? "nomeCompleto-error" : undefined}
                        />
                        {errors.nomeCompleto && (
                          <p id="nomeCompleto-error" className="flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" aria-hidden="true" />
                            {errors.nomeCompleto}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="dataNascimento" className="flex items-center gap-1 text-base">
                            Data de nascimento *
                            <ContextualHelp 
                              content="O programa atende jovens de 11 a 17 anos. A data de nascimento é usada para verificar a elegibilidade."
                            />
                          </Label>
                          <Input
                            id="dataNascimento"
                            type="date"
                            value={formData.dataNascimento}
                            onChange={(e) => handleInputChange("dataNascimento", e.target.value)}
                            className={`h-12 text-base ${errors.dataNascimento ? "border-destructive" : ""}`}
                            required
                            aria-describedby={errors.dataNascimento ? "dataNascimento-error" : undefined}
                          />
                          {errors.dataNascimento && (
                            <p id="dataNascimento-error" className="flex items-center gap-1 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4" aria-hidden="true" />
                              {errors.dataNascimento}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="genero" className="text-base">
                            Gênero *
                          </Label>
                          <Select 
                            value={formData.genero} 
                            onValueChange={(value) => handleInputChange("genero", value)}
                          >
                            <SelectTrigger className={`h-12 text-base ${errors.genero ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="feminino">Feminino</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                              <SelectItem value="prefiro-nao-dizer">Prefiro não dizer</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.genero && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4" aria-hidden="true" />
                              {errors.genero}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cpf" className="text-base">CPF *</Label>
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange("cpf", e.target.value)}
                            className={`h-12 text-base ${errors.cpf ? "border-destructive" : ""}`}
                            required
                          />
                          {errors.cpf && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4" aria-hidden="true" />
                              {errors.cpf}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rg" className="text-base">RG</Label>
                          <Input
                            id="rg"
                            placeholder="Digite o RG"
                            value={formData.rg}
                            onChange={(e) => handleInputChange("rg", e.target.value)}
                            className="h-12 text-base"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="telefone" className="text-base">Telefone *</Label>
                          <Input
                            id="telefone"
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={formData.telefone}
                            onChange={(e) => handleInputChange("telefone", e.target.value)}
                            className={`h-12 text-base ${errors.telefone ? "border-destructive" : ""}`}
                            required
                          />
                          {errors.telefone && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4" aria-hidden="true" />
                              {errors.telefone}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-base">E-mail</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="exemplo@email.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="h-12 text-base"
                          />
                        </div>
                      </div>

                      <div className={`rounded-xl border bg-muted/50 p-4 ${errors.termos ? "border-destructive/50" : "border-border"}`}>
                        <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                          <Info className="h-5 w-5 text-primary" aria-hidden="true" />
                          Dados do Responsável
                          <ContextualHelp 
                            content="Precisamos dos dados de um responsável maior de 18 anos para autorizar o tratamento do menor de idade."
                          />
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="nomeResponsavel" className="text-base">
                              Nome do responsável *
                            </Label>
                            <Input
                              id="nomeResponsavel"
                              placeholder="Nome completo do pai, mãe ou responsável"
                              value={formData.nomeResponsavel}
                              onChange={(e) => handleInputChange("nomeResponsavel", e.target.value)}
                              className={`h-12 text-base ${errors.nomeResponsavel ? "border-destructive" : ""}`}
                              required
                            />
                            {errors.nomeResponsavel && (
                              <p className="flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                {errors.nomeResponsavel}
                              </p>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="telefoneResponsavel" className="text-base">
                                Telefone do responsável *
                              </Label>
                              <Input
                                id="telefoneResponsavel"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={formData.telefoneResponsavel}
                                onChange={(e) => handleInputChange("telefoneResponsavel", e.target.value)}
                                className={`h-12 text-base ${errors.telefoneResponsavel ? "border-destructive" : ""}`}
                                required
                              />
                              {errors.telefoneResponsavel && (
                                <p className="flex items-center gap-1 text-sm text-destructive">
                                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                  {errors.telefoneResponsavel}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="parentesco" className="text-base">Parentesco *</Label>
                              <Select 
                                value={formData.parentesco} 
                                onValueChange={(value) => handleInputChange("parentesco", value)}
                              >
                                <SelectTrigger className={`h-12 text-base ${errors.parentesco ? "border-destructive" : ""}`}>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pai">Pai</SelectItem>
                                  <SelectItem value="mae">Mãe</SelectItem>
                                  <SelectItem value="avo">Avô/Avó</SelectItem>
                                  <SelectItem value="tio">Tio/Tia</SelectItem>
                                  <SelectItem value="tutor">Tutor Legal</SelectItem>
                                  <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.parentesco && (
                                <p className="flex items-center gap-1 text-sm text-destructive">
                                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                  {errors.parentesco}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Address */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cep" className="text-base">CEP *</Label>
                          <Input
                            id="cep"
                            placeholder="00000-000"
                            value={formData.cep}
                            onChange={(e) => handleInputChange("cep", e.target.value)}
                            className={`h-12 text-base ${errors.cep ? "border-destructive" : ""}`}
                            required
                          />
                          {isCepLoading && (
                            <p className="text-sm text-muted-foreground">Buscando endereço pelo CEP...</p>
                          )}
                          {!isCepLoading && cepFeedback && (
                            <p className="text-sm text-muted-foreground">{cepFeedback}</p>
                          )}
                          {errors.cep && <p className="text-sm text-destructive">{errors.cep}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado" className="text-base">Estado *</Label>
                          <Select 
                            value={formData.estado} 
                            onValueChange={(value) => handleInputChange("estado", value)}
                          >
                            <SelectTrigger className={`h-12 text-base ${errors.estado ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                              <SelectItem value="BA">Bahia</SelectItem>
                              <SelectItem value="PR">Paraná</SelectItem>
                              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="CE">Ceará</SelectItem>
                              <SelectItem value="PA">Pará</SelectItem>
                              <SelectItem value="SC">Santa Catarina</SelectItem>
                              <SelectItem value="GO">Goiás</SelectItem>
                              <SelectItem value="MA">Maranhão</SelectItem>
                              <SelectItem value="AM">Amazonas</SelectItem>
                              <SelectItem value="ES">Espírito Santo</SelectItem>
                              <SelectItem value="PB">Paraíba</SelectItem>
                              <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                              <SelectItem value="MT">Mato Grosso</SelectItem>
                              <SelectItem value="AL">Alagoas</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                              <SelectItem value="DF">Distrito Federal</SelectItem>
                              <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="SE">Sergipe</SelectItem>
                              <SelectItem value="RO">Rondônia</SelectItem>
                              <SelectItem value="TO">Tocantins</SelectItem>
                              <SelectItem value="AC">Acre</SelectItem>
                              <SelectItem value="AP">Amapá</SelectItem>
                              <SelectItem value="RR">Roraima</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.estado && <p className="text-sm text-destructive">{errors.estado}</p>}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cidade" className="text-base">Cidade *</Label>
                          <Input
                            id="cidade"
                            placeholder="Nome da cidade"
                            value={formData.cidade}
                            onChange={(e) => handleInputChange("cidade", e.target.value)}
                            className={`h-12 text-base ${errors.cidade ? "border-destructive" : ""}`}
                            required
                          />
                          {errors.cidade && <p className="text-sm text-destructive">{errors.cidade}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bairro" className="text-base">Bairro *</Label>
                          <Input
                            id="bairro"
                            placeholder="Nome do bairro"
                            value={formData.bairro}
                            onChange={(e) => handleInputChange("bairro", e.target.value)}
                            className={`h-12 text-base ${errors.bairro ? "border-destructive" : ""}`}
                            required
                          />
                          {errors.bairro && <p className="text-sm text-destructive">{errors.bairro}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endereco" className="text-base">Endereço *</Label>
                        <Input
                          id="endereco"
                          placeholder="Rua, Avenida, etc."
                          value={formData.endereco}
                          onChange={(e) => handleInputChange("endereco", e.target.value)}
                          className={`h-12 text-base ${errors.endereco ? "border-destructive" : ""}`}
                          required
                        />
                        {errors.endereco && <p className="text-sm text-destructive">{errors.endereco}</p>}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="numero" className="text-base">Número *</Label>
                          <Input
                            id="numero"
                            placeholder="Número"
                            value={formData.numero}
                            onChange={(e) => handleInputChange("numero", e.target.value)}
                            className={`h-12 text-base ${errors.numero ? "border-destructive" : ""}`}
                            required
                          />
                          {errors.numero && <p className="text-sm text-destructive">{errors.numero}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complemento" className="text-base">Complemento</Label>
                          <Input
                            id="complemento"
                            placeholder="Apto, Bloco, etc."
                            value={formData.complemento}
                            onChange={(e) => handleInputChange("complemento", e.target.value)}
                            className="h-12 text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Additional Info */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="escola" className="text-base">Nome da escola</Label>
                          <Input
                            id="escola"
                            placeholder="Nome da escola onde estuda"
                            value={formData.escola}
                            onChange={(e) => handleInputChange("escola", e.target.value)}
                            className="h-12 text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="serie" className="text-base">Série/Ano</Label>
                          <Select 
                            value={formData.serie} 
                            onValueChange={(value) => handleInputChange("serie", value)}
                          >
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6ano">6º Ano</SelectItem>
                              <SelectItem value="7ano">7º Ano</SelectItem>
                              <SelectItem value="8ano">8º Ano</SelectItem>
                              <SelectItem value="9ano">9º Ano</SelectItem>
                              <SelectItem value="1medio">1º Ano (Ensino Médio)</SelectItem>
                              <SelectItem value="2medio">2º Ano (Ensino Médio)</SelectItem>
                              <SelectItem value="3medio">3º Ano (Ensino Médio)</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rendaFamiliar" className="text-base">
                          Renda familiar mensal *
                        </Label>
                        <Select 
                          value={formData.rendaFamiliar} 
                          onValueChange={(value) => handleInputChange("rendaFamiliar", value)}
                        >
                          <SelectTrigger className={`h-12 text-base ${errors.rendaFamiliar ? "border-destructive" : ""}`}>
                            <SelectValue placeholder="Selecione a faixa de renda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ate-1">Até 1 salário mínimo</SelectItem>
                            <SelectItem value="1-2">De 1 a 2 salários mínimos</SelectItem>
                            <SelectItem value="2-3">De 2 a 3 salários mínimos</SelectItem>
                            <SelectItem value="3-mais">Mais de 3 salários mínimos</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.rendaFamiliar && (
                          <p className="flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" aria-hidden="true" />
                            {errors.rendaFamiliar}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comoConheceu" className="text-base">
                          Como conheceu a Turma do Bem?
                        </Label>
                        <Select 
                          value={formData.comoConheceu} 
                          onValueChange={(value) => handleInputChange("comoConheceu", value)}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="escola">Escola</SelectItem>
                            <SelectItem value="internet">Internet/Redes Sociais</SelectItem>
                            <SelectItem value="amigos">Amigos/Família</SelectItem>
                            <SelectItem value="posto-saude">Posto de Saúde</SelectItem>
                            <SelectItem value="tv-radio">TV/Rádio</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="necessidadesEspeciais" className="text-base">
                          Possui alguma necessidade especial ou condição de saúde que devemos saber?
                        </Label>
                        <Textarea
                          id="necessidadesEspeciais"
                          placeholder="Descreva aqui se houver alguma condição que a equipe deva saber (alergias, deficiências, etc.)"
                          value={formData.necessidadesEspeciais}
                          onChange={(e) => handleInputChange("necessidadesEspeciais", e.target.value)}
                          className="min-h-[100px] text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacoes" className="text-base">
                          Observações adicionais
                        </Label>
                        <Textarea
                          id="observacoes"
                          placeholder="Informações adicionais que você gostaria de compartilhar"
                          value={formData.observacoes}
                          onChange={(e) => handleInputChange("observacoes", e.target.value)}
                          className="min-h-[100px] text-base"
                        />
                      </div>

                      <div className="rounded-xl border border-border bg-muted/50 p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="termos"
                            checked={formData.termos}
                            onCheckedChange={(checked) => handleInputChange("termos", checked as boolean)}
                            className="mt-1 h-5 w-5"
                          />
                          <Label htmlFor="termos" className="text-sm leading-relaxed cursor-pointer">
                            Li e concordo com os{" "}
                            <Link to="/termos" className="text-primary hover:underline">
                              Termos de Uso
                            </Link>{" "}
                            e a{" "}
                            <Link to="/privacidade" className="text-primary hover:underline">
                              Política de Privacidade
                            </Link>
                            . Autorizo o uso dos dados para fins de cadastro e acompanhamento pelo programa.
                          </Label>
                        </div>
                        {errors.termos && (
                          <p className="mt-3 flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" aria-hidden="true" />
                            {errors.termos}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Success State */}
                  {currentStep === 4 && (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Cadastro enviado com sucesso!
                      </h2>
                      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                        {registrationResponse?.message || "Recebemos seu cadastro. Nossa equipe irá analisar suas informações e entrará em contato em até 15 dias úteis."}
                      </p>
                      
                      {/* Credentials Card */}
                      {registrationResponse && (
                        <div className="mt-6 mx-auto max-w-md rounded-xl bg-card border border-primary/30 p-6 text-left">
                          <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-4">
                            <Key className="h-5 w-5 text-primary" aria-hidden="true" />
                            Suas credenciais de acesso
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Login:</span>
                              <span className="text-base font-mono font-semibold text-foreground bg-muted px-2 py-1 rounded">
                                {registrationResponse.login}
                              </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Senha temporária:</span>
                              <span className="text-base font-mono font-semibold text-foreground bg-muted px-2 py-1 rounded">
                                {registrationResponse.temporary_password}
                              </span>
                            </div>
                            
                            {registrationResponse.next_step && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <span className="text-sm font-medium text-muted-foreground">Próximo passo:</span>
                                <p className="mt-1 text-sm text-foreground">
                                  {registrationResponse.next_step}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button size="lg" asChild className="h-12 gap-2">
                          <Link to="/login">
                            <Key className="h-5 w-5" aria-hidden="true" />
                            Ir para o Login
                          </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-12 gap-2">
                          <Link to="/">
                            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                            Voltar para o início
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  {currentStep < 4 && (
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                      {currentStep > 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={prevStep}
                          className="h-12 gap-2"
                        >
                          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                          Voltar
                        </Button>
                      ) : (
                        <div />
                      )}
                      {currentStep < 3 ? (
                        <Button
                          type="button"
                          size="lg"
                          onClick={nextStep}
                          className="h-12 gap-2"
                        >
                          Continuar
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          size="lg"
                          className="h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                          Enviar cadastro
                        </Button>
                      )}
                    </div>
                  )}
                </form>
                
                {/* Heurística 3: Prevenção de Erros - Dialog de confirmação antes de enviar */}
                <ConfirmationDialog
                  open={showSubmitDialog}
                  onOpenChange={setShowSubmitDialog}
                  title="Confirmar envio do cadastro"
                  description="Você confirma que todas as informações estão corretas? Após o envio, nossa equipe analisará seu cadastro."
                  confirmLabel="Sim, enviar cadastro"
                  cancelLabel="Revisar informações"
                  variant="default"
                  onConfirm={confirmSubmit}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
