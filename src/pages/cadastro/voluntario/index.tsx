import { useState } from "react"
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
import { Users, ArrowLeft, ArrowRight, CheckCircle2, Stethoscope, Briefcase, FileCheck, User, MapPin, AlertCircle, Key } from "lucide-react"
import { apiFetch, normalizeDigits, normalizeEmail } from "@/lib/api"

// Response type for registration endpoint
interface RegistrationSuccessResponse {
  id: number
  status: string
  message: string
  role: string
  login: string
  temporary_password: string
  next_step: string
}

const steps = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Dados Profissionais", icon: Briefcase },
  { id: 3, title: "Disponibilidade", icon: FileCheck },
]

export default function CadastroVoluntarioPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [registrationResponse, setRegistrationResponse] = useState<RegistrationSuccessResponse | null>(null)
  const [formData, setFormData] = useState({
    // Step 1
    nomeCompleto: "",
    dataNascimento: "",
    cpf: "",
    genero: "",
    telefone: "",
    email: "",
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    endereco: "",
    numero: "",
    // Step 2
    profissao: "",
    especialidade: "",
    cro: "",
    crp: "",
    clinica: "",
    enderecoClinica: "",
    tempoExperiencia: "",
    // Step 3
    diasDisponiveis: [] as string[],
    horariosDisponiveis: "",
    quantidadeAtendimentos: "",
    motivacao: "",
    comoConheceu: "",
    termos: false,
    termosVoluntariado: false,
  })

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDiaChange = (dia: string, checked: boolean) => {
    if (checked) {
      handleInputChange("diasDisponiveis", [...formData.diasDisponiveis, dia])
    } else {
      handleInputChange("diasDisponiveis", formData.diasDisponiveis.filter((d) => d !== dia))
    }
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Prepare payload with normalized values
      const payload = {
        ...formData,
        cpf: normalizeDigits(formData.cpf),
        telefone: normalizeDigits(formData.telefone),
        cep: normalizeDigits(formData.cep),
        email: normalizeEmail(formData.email),
      }
      
      const response = await apiFetch<RegistrationSuccessResponse>("/api/volunteers/registrations", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      
      setRegistrationResponse(response)
      setCurrentStep(4) // Success state
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar cadastro. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const diasSemana = [
    { value: "segunda", label: "Segunda-feira" },
    { value: "terca", label: "Terça-feira" },
    { value: "quarta", label: "Quarta-feira" },
    { value: "quinta", label: "Quinta-feira" },
    { value: "sexta", label: "Sexta-feira" },
    { value: "sabado", label: "Sábado" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary py-8 lg:py-12">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link 
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para o início
          </Link>

          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Stethoscope className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Cadastro de Voluntário
              </h1>
              <p className="mt-2 text-muted-foreground">
                Junte-se a mais de 17 mil profissionais que transformam vidas através do voluntariado.
              </p>
            </div>

            {/* Info Banner */}
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
              <div className="text-sm text-foreground">
                <strong>Quem pode ser voluntário?</strong>
                <p className="mt-1 text-muted-foreground">
                  Dentistas (CRO ativo), Psicólogos (CRP ativo) e outros profissionais de saúde que desejam doar seu tempo e expertise.
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            {currentStep < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                            currentStep >= step.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentStep > step.id ? (
                            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                          ) : (
                            <step.icon className="h-6 w-6" aria-hidden="true" />
                          )}
                        </div>
                        <span className={`mt-2 text-xs font-medium ${
                          currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`mx-2 h-1 w-12 rounded sm:w-20 lg:w-24 ${
                            currentStep > step.id ? "bg-primary" : "bg-muted"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
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
                      {currentStep === 1 && "Informe seus dados pessoais e de contato."}
                      {currentStep === 2 && "Informe seus dados profissionais e registro."}
                      {currentStep === 3 && "Informe sua disponibilidade para atendimentos."}
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
                          Nome completo *
                        </Label>
                        <Input
                          id="nomeCompleto"
                          placeholder="Digite seu nome completo"
                          value={formData.nomeCompleto}
                          onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                          className="h-12 text-base"
                          required
                        />
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
                            className="h-12 text-base"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cpf" className="text-base">CPF *</Label>
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange("cpf", e.target.value)}
                            className="h-12 text-base"
                            required
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
                            className="h-12 text-base"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-base">E-mail *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="h-12 text-base"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cep" className="text-base">CEP *</Label>
                          <Input
                            id="cep"
                            placeholder="00000-000"
                            value={formData.cep}
                            onChange={(e) => handleInputChange("cep", e.target.value)}
                            className="h-12 text-base"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado" className="text-base">Estado *</Label>
                          <Select 
                            value={formData.estado} 
                            onValueChange={(value) => handleInputChange("estado", value)}
                          >
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Selecione" />
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
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
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
                            className="h-12 text-base"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bairro" className="text-base">Bairro *</Label>
                          <Input
                            id="bairro"
                            placeholder="Nome do bairro"
                            value={formData.bairro}
                            onChange={(e) => handleInputChange("bairro", e.target.value)}
                            className="h-12 text-base"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Professional Data */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="profissao" className="text-base">
                          Profissão *
                        </Label>
                        <Select 
                          value={formData.profissao} 
                          onValueChange={(value) => handleInputChange("profissao", value)}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecione sua profissão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dentista">Dentista</SelectItem>
                            <SelectItem value="psicologo">Psicólogo</SelectItem>
                            <SelectItem value="outro">Outro profissional de saúde</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.profissao === "dentista" && (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="cro" className="text-base">CRO *</Label>
                              <Input
                                id="cro"
                                placeholder="Número do CRO"
                                value={formData.cro}
                                onChange={(e) => handleInputChange("cro", e.target.value)}
                                className="h-12 text-base"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="especialidade" className="text-base">
                                Especialidade
                              </Label>
                              <Select 
                                value={formData.especialidade} 
                                onValueChange={(value) => handleInputChange("especialidade", value)}
                              >
                                <SelectTrigger className="h-12 text-base">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="clinico-geral">Clínico Geral</SelectItem>
                                  <SelectItem value="ortodontia">Ortodontia</SelectItem>
                                  <SelectItem value="endodontia">Endodontia</SelectItem>
                                  <SelectItem value="periodontia">Periodontia</SelectItem>
                                  <SelectItem value="odontopediatria">Odontopediatria</SelectItem>
                                  <SelectItem value="cirurgia">Cirurgia</SelectItem>
                                  <SelectItem value="protese">Prótese</SelectItem>
                                  <SelectItem value="outra">Outra</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}

                      {formData.profissao === "psicologo" && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="crp" className="text-base">CRP *</Label>
                            <Input
                              id="crp"
                              placeholder="Número do CRP"
                              value={formData.crp}
                              onChange={(e) => handleInputChange("crp", e.target.value)}
                              className="h-12 text-base"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="especialidade" className="text-base">
                              Área de atuação
                            </Label>
                            <Select 
                              value={formData.especialidade} 
                              onValueChange={(value) => handleInputChange("especialidade", value)}
                            >
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clinica">Clínica</SelectItem>
                                <SelectItem value="infantil">Infantil</SelectItem>
                                <SelectItem value="adolescentes">Adolescentes</SelectItem>
                                <SelectItem value="familiar">Familiar</SelectItem>
                                <SelectItem value="outra">Outra</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="tempoExperiencia" className="text-base">
                          Tempo de experiência *
                        </Label>
                        <Select 
                          value={formData.tempoExperiencia} 
                          onValueChange={(value) => handleInputChange("tempoExperiencia", value)}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-2">0 a 2 anos</SelectItem>
                            <SelectItem value="2-5">2 a 5 anos</SelectItem>
                            <SelectItem value="5-10">5 a 10 anos</SelectItem>
                            <SelectItem value="10+">Mais de 10 anos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clinica" className="text-base">
                          Nome da clínica/consultório
                        </Label>
                        <Input
                          id="clinica"
                          placeholder="Nome do local de atendimento"
                          value={formData.clinica}
                          onChange={(e) => handleInputChange("clinica", e.target.value)}
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="enderecoClinica" className="text-base">
                          Endereço da clínica/consultório *
                        </Label>
                        <Input
                          id="enderecoClinica"
                          placeholder="Endereço completo onde realizará os atendimentos"
                          value={formData.enderecoClinica}
                          onChange={(e) => handleInputChange("enderecoClinica", e.target.value)}
                          className="h-12 text-base"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Availability */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-base">
                          Dias disponíveis para atendimento *
                        </Label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {diasSemana.map((dia) => (
                            <div key={dia.value} className="flex items-center space-x-3">
                              <Checkbox
                                id={dia.value}
                                checked={formData.diasDisponiveis.includes(dia.value)}
                                onCheckedChange={(checked) => handleDiaChange(dia.value, checked as boolean)}
                                className="h-5 w-5"
                              />
                              <Label htmlFor={dia.value} className="text-sm cursor-pointer">
                                {dia.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="horariosDisponiveis" className="text-base">
                          Horários disponíveis *
                        </Label>
                        <Select 
                          value={formData.horariosDisponiveis} 
                          onValueChange={(value) => handleInputChange("horariosDisponiveis", value)}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manha">Manhã (8h - 12h)</SelectItem>
                            <SelectItem value="tarde">Tarde (13h - 18h)</SelectItem>
                            <SelectItem value="noite">Noite (18h - 21h)</SelectItem>
                            <SelectItem value="integral">Integral</SelectItem>
                            <SelectItem value="flexivel">Flexível</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantidadeAtendimentos" className="text-base">
                          Quantos pacientes pode atender por mês? *
                        </Label>
                        <Select 
                          value={formData.quantidadeAtendimentos} 
                          onValueChange={(value) => handleInputChange("quantidadeAtendimentos", value)}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-2">1 a 2 pacientes</SelectItem>
                            <SelectItem value="3-5">3 a 5 pacientes</SelectItem>
                            <SelectItem value="5-10">5 a 10 pacientes</SelectItem>
                            <SelectItem value="10+">Mais de 10 pacientes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="motivacao" className="text-base">
                          Por que você quer ser voluntário? *
                        </Label>
                        <Textarea
                          id="motivacao"
                          placeholder="Conte-nos um pouco sobre sua motivação para fazer parte da Turma do Bem"
                          value={formData.motivacao}
                          onChange={(e) => handleInputChange("motivacao", e.target.value)}
                          className="min-h-[120px] text-base"
                          required
                        />
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
                            <SelectItem value="cro-crp">CRO/CRP</SelectItem>
                            <SelectItem value="internet">Internet/Redes Sociais</SelectItem>
                            <SelectItem value="colega">Colega de profissão</SelectItem>
                            <SelectItem value="evento">Evento/Congresso</SelectItem>
                            <SelectItem value="tv-radio">TV/Rádio</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 rounded-xl border border-border bg-muted/50 p-4">
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
                            </Link>.
                          </Label>
                        </div>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="termosVoluntariado"
                            checked={formData.termosVoluntariado}
                            onCheckedChange={(checked) => handleInputChange("termosVoluntariado", checked as boolean)}
                            className="mt-1 h-5 w-5"
                          />
                          <Label htmlFor="termosVoluntariado" className="text-sm leading-relaxed cursor-pointer">
                            Declaro que me comprometo a realizar atendimentos voluntários sem custo para os beneficiários, 
                            seguindo as diretrizes da Turma do Bem.
                          </Label>
                        </div>
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
                        {registrationResponse?.message || "Obrigado por querer fazer parte da Turma do Bem! Nossa equipe irá analisar seu cadastro e entrar em contato em breve para os próximos passos."}
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
                          disabled={!formData.termos || !formData.termosVoluntariado}
                        >
                          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                          Enviar cadastro
                        </Button>
                      )}
                    </div>
                  )}
                </form>
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
