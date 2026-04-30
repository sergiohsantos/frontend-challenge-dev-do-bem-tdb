import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, User, Users, Eye, EyeOff, Phone, ArrowLeft, LogIn, Loader2 } from "lucide-react"
import { HelpButton } from "@/components/layout/help-button"
import { AlertBanner } from "@/components/ui/alert-banner"
import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/accessibility/language-switcher"
import { AccessibilityPanel } from "@/components/accessibility/accessibility-panel"
import { apiFetch, normalizeDigits, normalizeEmail, type LoginPayload, type LoginResponse } from "@/lib/api"
import { saveAuth, getRedirectPath, normalizeRole } from "@/lib/auth"

type LoginFormValues = {
  email: string
  cpf: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState<"beneficiario" | "voluntario">("beneficiario")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      cpf: "",
      password: "",
    },
    mode: "onSubmit",
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const login = userType === "beneficiario"
        ? normalizeDigits(data.cpf)
        : normalizeEmail(data.email)

      const payload: LoginPayload = {
        login,
        password: data.password,
        role: userType,
      }

      const response = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      // Normalize role before saving and redirecting
      const normalizedRole = normalizeRole(response.user.role)
      const userWithNormalizedRole = { ...response.user, role: normalizedRole }

      saveAuth(response.access_token, userWithNormalizedRole)

      const redirectPath = getRedirectPath(response.user.role)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2" aria-label={t.header.logoAlt}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold text-foreground">Turma do Bem</span>
          </Link>
          <div className="flex items-center gap-2">
            <AccessibilityPanel />
            <LanguageSwitcher />
            <Link 
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded ml-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t.common.back}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="mb-6 text-center sm:mb-8">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary sm:mb-4 sm:h-20 sm:w-20">
              <Heart className="h-8 w-8 text-primary-foreground sm:h-10 sm:w-10" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
              {t.login.welcomeBack}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
              {t.login.subtitle}
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-1 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl">{t.login.title}</CardTitle>
              <CardDescription className="text-sm">
                {t.login.selectProfile}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
              <Tabs value={userType} onValueChange={(v) => { setUserType(v as "beneficiario" | "voluntario"); setError(null) }}>
                <TabsList className="mb-4 grid h-11 w-full grid-cols-2 sm:mb-6 sm:h-10">
                  <TabsTrigger value="beneficiario" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:gap-2 sm:text-sm">
                    <User className="h-4 w-4" aria-hidden="true" />
                    {t.nav.beneficiary}
                  </TabsTrigger>
                  <TabsTrigger value="voluntario" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:gap-2 sm:text-sm">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {t.nav.volunteer}
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  {error && (
                    <AlertBanner
                      type="error"
                      message={error}
                      dismissible
                      onDismiss={() => setError(null)}
                    />
                  )}
                  
                  <TabsContent value="beneficiario" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf-beneficiario" className="text-base">
                        {t.forms.cpf}
                      </Label>
                      <Controller
                        name="cpf"
                        control={control}
                        rules={{
                          validate: (value) => userType !== "beneficiario" || normalizeDigits(value).length > 0 || t.forms.requiredField,
                        }}
                        render={({ field }) => (
                          <Input
                            id="cpf-beneficiario"
                            type="text"
                            placeholder="000.000.000-00"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              setError(null)
                              field.onChange(e)
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="h-12 text-base"
                            autoComplete="username"
                            required
                            aria-describedby="cpf-help"
                          />
                        )}
                      />
                      <p id="cpf-help" className="text-xs text-muted-foreground">
                        {t.forms.requiredField}
                      </p>
                      {errors.cpf && userType === "beneficiario" ? (
                        <p className="text-xs text-destructive">{errors.cpf.message}</p>
                      ) : null}
                    </div>
                  </TabsContent>

                  <TabsContent value="voluntario" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-voluntario" className="text-base">
                        {t.forms.email}
                      </Label>
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
                          <Input
                            id="email-voluntario"
                            type="email"
                            placeholder="seu@email.com"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              setError(null)
                              field.onChange(e)
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="h-12 text-base"
                            autoComplete="username email"
                            required
                            aria-describedby="email-help"
                          />
                        )}
                      />
                      <p id="email-help" className="text-xs text-muted-foreground">
                        {t.forms.requiredField}
                      </p>
                      {errors.email && userType === "voluntario" ? (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      ) : null}
                    </div>
                  </TabsContent>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-base">
                        {t.forms.password}
                      </Label>
                      <Link 
                        to="/recuperar-senha"
                        className="text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {t.forms.forgotPassword}
                      </Link>
                    </div>
                    <div className="relative">
                      <Controller
                        name="password"
                        control={control}
                        rules={{
                          required: t.forms.requiredField,
                        }}
                        render={({ field }) => (
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t.forms.password}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              setError(null)
                              field.onChange(e)
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="h-12 pr-12 text-base"
                            autoComplete="current-password"
                            required
                          />
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded"
                        aria-label={showPassword ? t.forms.password : t.forms.password}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {errors.password ? (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full gap-2 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        {t.common.loading}
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" aria-hidden="true" />
                        {t.nav.login}
                      </>
                    )}
                  </Button>
                </form>
              </Tabs>

              {/* Help Link */}
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-sm text-foreground">
                    {t.common.help}? <strong>0800 777 7766</strong>
                  </p>
                </div>
              </div>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t.login.noAccount}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/cadastro/beneficiario">
                      {t.login.beneficiaryProfile}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/cadastro/voluntario">
                      {t.login.volunteerProfile}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
