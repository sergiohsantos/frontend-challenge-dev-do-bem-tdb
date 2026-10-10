import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertBanner } from "@/components/ui/alert-banner"
import { AccessibilityPanel } from "@/components/accessibility/accessibility-panel"
import { HelpButton } from "@/components/layout/help-button"
import { apiFetch, normalizeDigits, normalizeEmail, type LoginPayload, type LoginResponse } from "@/lib/api"
import { saveAuth, getRedirectPath, normalizeRole } from "@/lib/auth"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Heart, Loader2, LockKeyhole, LogIn, Phone, ShieldCheck, User, Users } from "lucide-react"

type LoginFormValues = {
  email: string
  cpf: string
  password: string
}

const t = {
  header: { logoAlt: "Turma do Bem - Pelo direito de sorrir" },
  common: { back: "Voltar", loading: "Entrando...", help: "Precisa de ajuda" },
  nav: { beneficiary: "Beneficiário", volunteer: "Voluntário", login: "Entrar" },
  login: {
    welcomeBack: "Acesse sua jornada",
    subtitle: "Entre para acompanhar consultas, documentos, mensagens e próximos passos.",
    title: "Entrar na plataforma",
    selectProfile: "Escolha o perfil correto para continuar com segurança.",
    noAccount: "Ainda não tem acesso?",
    beneficiaryProfile: "Cadastro beneficiário",
    volunteerProfile: "Cadastro voluntário",
  },
  forms: {
    cpf: "CPF",
    email: "E-mail",
    password: "Senha",
    forgotPassword: "Recuperar acesso",
    requiredField: "Campo obrigatório",
    invalidEmail: "Informe um e-mail válido",
    invalidCpf: "Informe um CPF válido com 11 números.",
  },
}

const valueCards = [
  "Próximo passo sempre visível",
  "Consultas, mensagens e documentos no mesmo fluxo",
  "Acesso separado por perfil para proteger informações",
]

function formatCpf(value: string) {
  const digits = normalizeDigits(value).slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState<"beneficiario" | "voluntario">("beneficiario")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", cpf: "", password: "" },
    mode: "onSubmit",
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const login = userType === "beneficiario" ? normalizeDigits(data.cpf) : normalizeEmail(data.email)
      const payload: LoginPayload = { login, password: data.password, role: userType }

      const response = await apiFetch<LoginResponse>("/api/auth/browser/login", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const normalizedRole = normalizeRole(response.user.role)
      const userWithNormalizedRole = { ...response.user, role: normalizedRole }

      saveAuth(response.access_token, userWithNormalizedRole)
      navigate(getRedirectPath(response.user.role), { replace: true })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível entrar agora. Confira seus dados e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="group flex items-center gap-3" aria-label={t.header.logoAlt}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-sm transition-transform group-hover:scale-105">
              <Heart className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-lg font-black text-foreground">Turma do Bem</span>
          </Link>
          <div className="flex items-center gap-2">
            <AccessibilityPanel />
            <Button variant="ghost" size="sm" asChild className="gap-2 rounded-full">
              <Link to="/"><ArrowLeft className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{t.common.back}</span></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="tdb-premium-shell relative overflow-hidden bg-primary text-primary-foreground">
          <div className="tdb-orb left-[-5rem] top-14 h-72 w-72 bg-secondary" aria-hidden="true" />
          <div className="tdb-orb tdb-orb-delayed bottom-[-5rem] right-[-5rem] h-80 w-80 bg-accent" aria-hidden="true" />
          <div className="container relative mx-auto grid min-h-[calc(100vh-4rem)] gap-10 px-4 py-10 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:py-16">
            <section className="tdb-reveal hidden lg:block">
              <span className="inline-flex rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.22em] text-accent">Área segura</span>
              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight xl:text-7xl">Cuidado organizado para cada etapa da jornada.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/84">Acesse a plataforma para acompanhar informações importantes com clareza, segurança e orientação.</p>

              <div className="mt-8 grid gap-3">
                {valueCards.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
                    <span className="text-sm font-bold text-primary-foreground/90">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[2rem] border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <p className="font-black">Acesso por perfil</p>
                    <p className="mt-1 text-sm leading-6 text-primary-foreground/78">Beneficiário e voluntário entram por caminhos separados para preservar contexto, dados e permissões.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="tdb-reveal tdb-reveal-delay-1 mx-auto w-full max-w-md lg:max-w-lg">
              <div className="mb-6 text-center lg:hidden">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-foreground/10 text-accent backdrop-blur">
                  <Heart className="h-8 w-8" aria-hidden="true" />
                </div>
                <h1 className="text-3xl font-black tracking-tight">{t.login.welcomeBack}</h1>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/80">{t.login.subtitle}</p>
              </div>

              <Card className="rounded-[2.25rem] border border-primary-foreground/15 bg-background text-foreground shadow-2xl shadow-primary/25">
                <CardHeader className="p-6 pb-3 sm:p-8 sm:pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{t.login.title}</CardTitle>
                      <CardDescription className="mt-2 text-sm leading-6 text-muted-foreground">{t.login.selectProfile}</CardDescription>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><LockKeyhole className="h-6 w-6" aria-hidden="true" /></div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
                  <Tabs value={userType} onValueChange={(v) => { setUserType(v as "beneficiario" | "voluntario"); setError(null) }}>
                    <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-full bg-muted">
                      <TabsTrigger value="beneficiario" className="gap-2 rounded-full text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"><User className="h-4 w-4" aria-hidden="true" />{t.nav.beneficiary}</TabsTrigger>
                      <TabsTrigger value="voluntario" className="gap-2 rounded-full text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"><Users className="h-4 w-4" aria-hidden="true" />{t.nav.volunteer}</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                      {error && <AlertBanner type="error" message={error} dismissible onDismiss={() => setError(null)} />}

                      <TabsContent value="beneficiario" className="mt-0 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="cpf-beneficiario" className="text-sm font-black text-foreground">{t.forms.cpf}</Label>
                          <Controller
                            name="cpf"
                            control={control}
                            rules={{
                              validate: (value) => {
                                if (userType !== "beneficiario") return true
                                const digits = normalizeDigits(value)
                                if (!digits) return t.forms.requiredField
                                return digits.length === 11 || t.forms.invalidCpf
                              },
                            }}
                            render={({ field }) => (
                              <Input
                                id="cpf-beneficiario"
                                type="text"
                                inputMode="numeric"
                                maxLength={14}
                                placeholder="000.000.000-00"
                                value={field.value ?? ""}
                                onChange={(event) => {
                                  setError(null)
                                  field.onChange(formatCpf(event.target.value))
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                className="h-12 rounded-2xl bg-background text-base text-foreground placeholder:text-muted-foreground"
                                autoComplete="username"
                                required
                                aria-describedby="cpf-help"
                              />
                            )}
                          />
                          <p id="cpf-help" className="text-xs text-muted-foreground">Digite somente os 11 números do CPF cadastrado.</p>
                          {errors.cpf && userType === "beneficiario" ? <p className="text-xs text-destructive">{errors.cpf.message}</p> : null}
                        </div>
                      </TabsContent>

                      <TabsContent value="voluntario" className="mt-0 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email-voluntario" className="text-sm font-black text-foreground">{t.forms.email}</Label>
                          <Controller
                            name="email"
                            control={control}
                            rules={{
                              validate: (value) => {
                                if (userType !== "voluntario") return true
                                if (!value.trim()) return t.forms.requiredField
                                return /\S+@\S+\.\S+/.test(value) || t.forms.invalidEmail
                              },
                            }}
                            render={({ field }) => (
                              <Input id="email-voluntario" type="email" placeholder="seu@email.com" value={field.value ?? ""} onChange={(e) => { setError(null); field.onChange(e) }} onBlur={field.onBlur} name={field.name} className="h-12 rounded-2xl bg-background text-base text-foreground placeholder:text-muted-foreground" autoComplete="username email" required aria-describedby="email-help" />
                            )}
                          />
                          <p id="email-help" className="text-xs text-muted-foreground">Use o e-mail cadastrado como voluntário.</p>
                          {errors.email && userType === "voluntario" ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
                        </div>
                      </TabsContent>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="password" className="text-sm font-black text-foreground">{t.forms.password}</Label>
                          <Link to="/recuperar-senha" className="rounded text-sm font-bold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring">{t.forms.forgotPassword}</Link>
                        </div>
                        <div className="relative">
                          <Controller
                            name="password"
                            control={control}
                            rules={{ required: t.forms.requiredField }}
                            render={({ field }) => (
                              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={field.value ?? ""} onChange={(e) => { setError(null); field.onChange(e) }} onBlur={field.onBlur} name={field.name} className="h-12 rounded-2xl bg-background pr-12 text-base text-foreground placeholder:text-muted-foreground" autoComplete="current-password" required />
                            )}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 rounded text-muted-foreground -translate-y-1/2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                          </button>
                        </div>
                        {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
                      </div>

                      <Button type="submit" size="lg" className="h-12 w-full gap-2 rounded-full text-base font-black" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.common.loading}</> : <><LogIn className="h-5 w-5" aria-hidden="true" />{t.nav.login}</>}
                      </Button>
                    </form>
                  </Tabs>

                  <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                      <p className="text-sm text-foreground">{t.common.help}? <a href="tel:08007777766" className="font-black text-primary hover:underline">0800 777 7766</a></p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">{t.login.noAccount}</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button variant="outline" size="sm" asChild className="flex-1 rounded-full"><Link to="/cadastro/beneficiario">{t.login.beneficiaryProfile}</Link></Button>
                      <Button variant="outline" size="sm" asChild className="flex-1 rounded-full"><Link to="/cadastro/voluntario">{t.login.volunteerProfile}</Link></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </section>
      </main>

      <HelpButton />
    </div>
  )
}

