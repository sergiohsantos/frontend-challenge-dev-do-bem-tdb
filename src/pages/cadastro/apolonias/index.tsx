import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Heart, ArrowLeft, ArrowRight, CheckCircle2, Phone, Info, User, MapPin, FileText, Shield, AlertCircle, Lock, Loader2, Key } from "lucide-react"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { ContextualHelp } from "@/components/ui/contextual-help"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { apiFetch, normalizeDigits } from "@/lib/api"
import { fetchAddressByCep } from "@/lib/viacep"

// Response type for the Apolônias registration endpoint
interface ApoloniasRegistrationResponse {
  id: number
  status: string
  message: string
  role: string
  program: string
  login: string
  temporary_password: string
  next_step: string
}

const steps = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Endereço", icon: MapPin },
  { id: 3, title: "Situação", icon: Shield },
  { id: 4, title: "Confirmação", icon: FileText },
]

export default function CadastroApoloniasPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [cepFeedback, setCepFeedback] = useState<string | null>(null)
  const [registrationResponse, setRegistrationResponse] = useState<ApoloniasRegistrationResponse | null>(null)
  const [formData, setFormData] = useState({
    // Dados pessoais
    nomeCompleto: "",
    dataNascimento: "",
    cpf: "",
    identidadeGenero: "",
    telefone: "",
    email: "",
    // Endereço
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    // Situação
    situacaoViolencia: "",
    tempoOcorrencia: "",
    possuiBoletimOcorrencia: "",
    acompanhamentoAssistencial: "",
    descricaoDanos: "",
    impactoVida: "",
    // Confirmação
    termos: false,
    privacidade: false,
    contatoSeguro: false,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
          setCepFeedback("CEP encontrado, mas a rua nÃ£o foi informada. Preencha o endereço manualmente.")
        }
        setFormData((prev) => ({
          ...prev,
          cep: address.cep,
          endereco: address.endereco,
          bairro: address.bairro,
          cidade: address.cidade,
          estado: address.estado,
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.nomeCompleto.trim()) newErrors.nomeCompleto = "Nome é obrigatório"
      if (!formData.dataNascimento) newErrors.dataNascimento = "Data de nascimento é obrigatória"
      if (!formData.cpf.trim()) {
        newErrors.cpf = "CPF é obrigatório"
      } else {
        const cpfDigits = normalizeDigits(formData.cpf)
        if (cpfDigits.length !== 11) {
          newErrors.cpf = "CPF deve ter 11 dígitos"
        }
      }
      if (!formData.telefone.trim()) newErrors.telefone = "Telefone é obrigatório"
    }
    
    if (step === 2) {
      if (!formData.cep.trim()) newErrors.cep = "CEP é obrigatório"
      if (!formData.cidade.trim()) newErrors.cidade = "Cidade é obrigatória"
      if (!formData.estado.trim()) newErrors.estado = "Estado é obrigatório"
    }
    
    if (step === 3) {
      if (!formData.situacaoViolencia) newErrors.situacaoViolencia = "Este campo é obrigatório"
      if (!formData.descricaoDanos.trim()) newErrors.descricaoDanos = "Descreva brevemente os danos"
    }
    
    if (step === 4) {
      if (!formData.termos) newErrors.termos = "Você deve aceitar os termos"
      if (!formData.privacidade) newErrors.privacidade = "Você deve aceitar a política de privacidade"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
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
      // Build payload with field names expected by backend (Portuguese)
      const payload = {
        // Dados pessoais
        nomeCompleto: formData.nomeCompleto.trim(),
        dataNascimento: formData.dataNascimento,
        cpf: normalizeDigits(formData.cpf),
        identidadeGenero: formData.identidadeGenero || "",
        telefone: normalizeDigits(formData.telefone),
        email: formData.email.trim() || "",
        // Endereço
        cep: normalizeDigits(formData.cep),
        endereco: formData.endereco.trim() || "",
        numero: formData.numero.trim() || "",
        complemento: formData.complemento.trim() || "",
        bairro: formData.bairro.trim() || "",
        cidade: formData.cidade.trim(),
        estado: formData.estado,
        // Situação específica do Apolônias
        situacaoViolencia: formData.situacaoViolencia,
        tempoOcorrencia: formData.tempoOcorrencia || "",
        possuiBoletimOcorrencia: formData.possuiBoletimOcorrencia || "",
        acompanhamentoAssistencial: formData.acompanhamentoAssistencial || "",
        descricaoDanos: formData.descricaoDanos.trim(),
        impactoVida: formData.impactoVida.trim() || "",
        // Confirmação
        termos: formData.termos,
        privacidade: formData.privacidade,
        contatoSeguro: formData.contatoSeguro,
      }

      const response = await apiFetch<ApoloniasRegistrationResponse>(
        "/api/apolonias/registrations",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      )

      setRegistrationResponse(response)
      setCurrentStep(5) // Success state
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erro ao enviar cadastro. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            {/* Back Link */}
            {currentStep < 5 && (
              <Link 
                to="/programas#apolonias-do-bem"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar para Apolônias do Bem
              </Link>
            )}

            {/* Success State */}
            {currentStep === 5 ? (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
                    <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    Cadastro recebido com sucesso!
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                    {registrationResponse?.message || "Seu cadastro foi enviado com segurança. Nossa equipe entrará em contato através dos meios de comunicação seguros que você indicou."}
                  </p>
                  
                  {/* Credentials Card */}
                  {registrationResponse && (
                    <div className="mt-6 rounded-xl bg-card border border-primary/30 p-6 text-left">
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
                  
                  <div className="mt-6 rounded-xl bg-card border border-border p-4 text-left">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                      Suas informações estão protegidas
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Todos os seus dados são tratados com total sigilo e segurança. 
                      Apenas a equipe autorizada da Turma do Bem terá acesso.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button asChild size="lg" className="h-12 gap-2">
                      <Link to="/login">
                        <Key className="h-5 w-5" aria-hidden="true" />
                        Ir para o Login
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 gap-2">
                      <Link to="/">
                        <Heart className="h-5 w-5" aria-hidden="true" />
                        Voltar ao início
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <Heart className="h-8 w-8 text-accent" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-2xl">Apolônias do Bem</CardTitle>
                  <CardDescription className="text-base">
                    Cadastro para mulheres vítimas de violência
                  </CardDescription>
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Seus dados são tratados com total sigilo e segurança
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Progress Steps */}
                  <div className="mb-8">
                    <ProgressIndicator
                      steps={steps.map((s) => ({
                        label: s.title,
                        completed: currentStep > s.id,
                        current: currentStep === s.id,
                      }))}
                      currentStep={currentStep}
                      variant="compact"
                    />
                    <p className="mt-3 text-center text-sm text-muted-foreground" role="status" aria-live="polite">
                      Etapa {currentStep} de {steps.length}: {steps[currentStep - 1].title}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* Step 1: Dados Pessoais */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4" aria-hidden="true" />
                            Preencha seus dados pessoais. Todas as informações são confidenciais.
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="nomeCompleto" className="text-base">
                              Nome completo *
                            </Label>
                            <Input
                              id="nomeCompleto"
                              placeholder="Digite seu nome completo"
                              value={formData.nomeCompleto}
                              onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                              className={`h-12 text-base ${errors.nomeCompleto ? "border-destructive" : ""}`}
                              required
                            />
                            {errors.nomeCompleto && (
                              <p className="flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                {errors.nomeCompleto}
                              </p>
                            )}
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="dataNascimento" className="text-base">
                                Data de nascimento *
                              </Label>
                              <Input
                                id="dataNascimento"
                                type="date"
                                value={formData.dataNascimento}
                                onChange={(e) => handleInputChange("dataNascimento", e.target.value)}
                                className={`h-12 text-base ${errors.dataNascimento ? "border-destructive" : ""}`}
                                required
                              />
                              {errors.dataNascimento && (
                                <p className="flex items-center gap-1 text-sm text-destructive">
                                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                  {errors.dataNascimento}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cpf" className="text-base">
                                CPF *
                              </Label>
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
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-1 text-base">
                              Identidade de gênero
                              <ContextualHelp 
                                content="O programa Apolônias do Bem atende mulheres cis e trans que sofreram violência."
                              />
                            </Label>
                            <Select
                              value={formData.identidadeGenero}
                              onValueChange={(value) => handleInputChange("identidadeGenero", value)}
                            >
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mulher-cis">Mulher cisgênero</SelectItem>
                                <SelectItem value="mulher-trans">Mulher transgênero</SelectItem>
                                <SelectItem value="outro">Prefiro não informar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="telefone" className="flex items-center gap-1 text-base">
                                Telefone de contato seguro *
                                <ContextualHelp 
                                  content="Informe um número seguro para contato. Podemos usar WhatsApp se preferir."
                                />
                              </Label>
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
                              <Label htmlFor="email" className="text-base">
                                E-mail (opcional)
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                className="h-12 text-base"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Endereço */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4" aria-hidden="true" />
                            Precisamos do seu endereço para encontrar um dentista voluntário próximo a você.
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-3">
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
                              {errors.cep && (
                                <p className="flex items-center gap-1 text-sm text-destructive">
                                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                  {errors.cep}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label htmlFor="endereco" className="text-base">Endereço</Label>
                              <Input
                                id="endereco"
                                placeholder="Rua, Avenida..."
                                value={formData.endereco}
                                onChange={(e) => handleInputChange("endereco", e.target.value)}
                                className={`h-12 text-base ${errors.endereco ? "border-destructive" : ""}`}
                              />
                              {errors.endereco && <p className="text-sm text-destructive">{errors.endereco}</p>}
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label htmlFor="numero" className="text-base">Número</Label>
                              <Input
                                id="numero"
                                placeholder="123"
                                value={formData.numero}
                                onChange={(e) => handleInputChange("numero", e.target.value)}
                                className={`h-12 text-base ${errors.numero ? "border-destructive" : ""}`}
                              />
                              {errors.numero && <p className="text-sm text-destructive">{errors.numero}</p>}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label htmlFor="complemento" className="text-base">Complemento</Label>
                              <Input
                                id="complemento"
                                placeholder="Apto, Bloco..."
                                value={formData.complemento}
                                onChange={(e) => handleInputChange("complemento", e.target.value)}
                                className="h-12 text-base"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bairro" className="text-base">Bairro</Label>
                            <Input
                              id="bairro"
                              placeholder="Nome do bairro"
                              value={formData.bairro}
                              onChange={(e) => handleInputChange("bairro", e.target.value)}
                              className={`h-12 text-base ${errors.bairro ? "border-destructive" : ""}`}
                            />
                            {errors.bairro && <p className="text-sm text-destructive">{errors.bairro}</p>}
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
                              {errors.cidade && (
                                <p className="flex items-center gap-1 text-sm text-destructive">
                                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                  {errors.cidade}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="estado" className="text-base">Estado *</Label>
                              <Select
                                value={formData.estado}
                                onValueChange={(value) => handleInputChange("estado", value)}
                              >
                                <SelectTrigger className={`h-12 text-base ${errors.estado ? "border-destructive" : ""}`}>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.estado && (
                                <p className="flex items-center gap-1 text-sm text-destructive">
                                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                  {errors.estado}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Situação */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                          <div className="flex items-start gap-2 text-sm text-foreground">
                            <Shield className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
                            <div>
                              <p className="font-medium">Suas informações são sigilosas</p>
                              <p className="mt-1 text-muted-foreground">
                                Entendemos que este é um momento delicado. Todas as informações são 
                                tratadas com absoluto sigilo e servem apenas para avaliar como podemos ajudá-la.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className={`space-y-3 rounded-xl ${errors.situacaoViolencia ? "border border-destructive/50 p-3" : ""}`}>
                            <Label className="text-base">
                              Você sofreu violência que afetou sua dentição? *
                            </Label>
                            <RadioGroup
                              value={formData.situacaoViolencia}
                              onValueChange={(value) => handleInputChange("situacaoViolencia", value)}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                                <RadioGroupItem value="sim" id="violencia-sim" />
                                <Label htmlFor="violencia-sim" className="flex-1 cursor-pointer">
                                  Sim, sofri violência que danificou meus dentes
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                                <RadioGroupItem value="parcialmente" id="violencia-parcial" />
                                <Label htmlFor="violencia-parcial" className="flex-1 cursor-pointer">
                                  Sim, mas os danos foram parciais
                                </Label>
                              </div>
                            </RadioGroup>
                            {errors.situacaoViolencia && (
                              <p className="flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                {errors.situacaoViolencia}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base">
                              Há quanto tempo ocorreu a violência?
                            </Label>
                            <Select
                              value={formData.tempoOcorrencia}
                              onValueChange={(value) => handleInputChange("tempoOcorrencia", value)}
                            >
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="menos-1-ano">Menos de 1 ano</SelectItem>
                                <SelectItem value="1-3-anos">Entre 1 e 3 anos</SelectItem>
                                <SelectItem value="3-5-anos">Entre 3 e 5 anos</SelectItem>
                                <SelectItem value="mais-5-anos">Mais de 5 anos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base">
                              Você possui Boletim de Ocorrência?
                            </Label>
                            <RadioGroup
                              value={formData.possuiBoletimOcorrencia}
                              onValueChange={(value) => handleInputChange("possuiBoletimOcorrencia", value)}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sim" id="bo-sim" />
                                <Label htmlFor="bo-sim" className="cursor-pointer">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nao" id="bo-nao" />
                                <Label htmlFor="bo-nao" className="cursor-pointer">Não</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="em-andamento" id="bo-andamento" />
                                <Label htmlFor="bo-andamento" className="cursor-pointer">Em andamento</Label>
                              </div>
                            </RadioGroup>
                            <p className="text-sm text-muted-foreground">
                              Não ter B.O. não impede sua participação no programa.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="descricaoDanos" className="text-base">
                              Descreva brevemente os danos sofridos *
                            </Label>
                            <Textarea
                              id="descricaoDanos"
                              placeholder="Conte-nos um pouco sobre como seus dentes foram afetados..."
                              value={formData.descricaoDanos}
                              onChange={(e) => handleInputChange("descricaoDanos", e.target.value)}
                              className={`min-h-[100px] text-base ${errors.descricaoDanos ? "border-destructive" : ""}`}
                              required
                            />
                            {errors.descricaoDanos && (
                              <p className="flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                {errors.descricaoDanos}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="impactoVida" className="text-base">
                              Como isso impacta sua vida hoje?
                            </Label>
                            <Textarea
                              id="impactoVida"
                              placeholder="Fale sobre como a situação afeta seu dia a dia, trabalho, autoestima..."
                              value={formData.impactoVida}
                              onChange={(e) => handleInputChange("impactoVida", e.target.value)}
                              className="min-h-[100px] text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base">
                              Você está recebendo acompanhamento de algum serviço assistencial?
                            </Label>
                            <Select
                              value={formData.acompanhamentoAssistencial}
                              onValueChange={(value) => handleInputChange("acompanhamentoAssistencial", value)}
                            >
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cras">CRAS / CREAS</SelectItem>
                                <SelectItem value="centro-referencia">Centro de Referência da Mulher</SelectItem>
                                <SelectItem value="defensoria">Defensoria Pública</SelectItem>
                                <SelectItem value="ong">ONG ou Instituição</SelectItem>
                                <SelectItem value="nenhum">Não estou recebendo acompanhamento</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Confirmação */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                          <h3 className="font-semibold text-foreground">Revise seus dados</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Confira as informações antes de enviar seu cadastro.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-xl border border-border p-4">
                            <h4 className="font-medium text-foreground flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" aria-hidden="true" />
                              Dados Pessoais
                            </h4>
                            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                              <div>
                                <dt className="text-muted-foreground">Nome</dt>
                                <dd className="font-medium text-foreground">{formData.nomeCompleto || "-"}</dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">Telefone</dt>
                                <dd className="font-medium text-foreground">{formData.telefone || "-"}</dd>
                              </div>
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border p-4">
                            <h4 className="font-medium text-foreground flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                              Endereço
                            </h4>
                            <dl className="mt-3 text-sm">
                              <dt className="sr-only">Endereço completo</dt>
                              <dd className="font-medium text-foreground">
                                {formData.cidade && formData.estado 
                                  ? `${formData.cidade} - ${formData.estado}` 
                                  : "-"}
                              </dd>
                            </dl>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4">
                          <div className={`flex items-start space-x-3 rounded-lg border p-4 ${errors.termos ? "border-destructive/50" : "border-border"}`}>
                            <Checkbox
                              id="termos"
                              checked={formData.termos}
                              onCheckedChange={(checked) => handleInputChange("termos", checked === true)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="termos" className="cursor-pointer leading-relaxed">
                                Li e aceito os{" "}
                                <Link to="/termos" className="text-primary underline">
                                  Termos de Uso
                                </Link>{" "}
                                do programa Apolônias do Bem *
                              </Label>
                            </div>
                          </div>
                          {errors.termos && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4" aria-hidden="true" />
                              {errors.termos}
                            </p>
                          )}

                          <div className={`flex items-start space-x-3 rounded-lg border p-4 ${errors.privacidade ? "border-destructive/50" : "border-border"}`}>
                            <Checkbox
                              id="privacidade"
                              checked={formData.privacidade}
                              onCheckedChange={(checked) => handleInputChange("privacidade", checked === true)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="privacidade" className="cursor-pointer leading-relaxed">
                                Autorizo o tratamento dos meus dados conforme a{" "}
                                <Link to="/privacidade" className="text-primary underline">
                                  Política de Privacidade
                                </Link>{" "}
                                *
                              </Label>
                            </div>
                          </div>
                          {errors.privacidade && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4" aria-hidden="true" />
                              {errors.privacidade}
                            </p>
                          )}

                          <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
                            <Checkbox
                              id="contatoSeguro"
                              checked={formData.contatoSeguro}
                              onCheckedChange={(checked) => handleInputChange("contatoSeguro", checked === true)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="contatoSeguro" className="cursor-pointer leading-relaxed">
                                Confirmo que o telefone/e-mail informado é seguro para contato
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
                      {currentStep > 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="h-12 gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                          Voltar
                        </Button>
                      ) : (
                        <div />
                      )}

                      {currentStep < 4 ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          Continuar
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4" aria-hidden="true" />
                              Enviar cadastro
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Submit Error Message */}
                    {submitError && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        {submitError}
                      </div>
                    )}
                  </form>
                  
                  {/* Confirmation Dialog */}
                  <ConfirmationDialog
                    open={showSubmitDialog}
                    onOpenChange={setShowSubmitDialog}
                    title="Confirmar envio do cadastro"
                    description="Você confirma que todas as informações estão corretas? Após o envio, nossa equipe analisará seu cadastro com sigilo e entrará em contato."
                    confirmLabel="Sim, enviar"
                    cancelLabel="Revisar"
                    variant="success"
                    onConfirm={confirmSubmit}
                  />
                </CardContent>
              </Card>
            )}

            {/* Help Info */}
            {currentStep < 5 && (
              <div className="mt-8 rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Phone className="h-5 w-5 text-accent" aria-hidden="true" />
                  Precisa de ajuda?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Se você está em situação de risco ou precisa de apoio imediato:
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-foreground">
                    <span className="font-semibold text-accent">180</span> - Central de Atendimento à Mulher
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <span className="font-semibold text-accent">190</span> - Polícia Militar
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
