import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiFetch, normalizeEmail, type LoginPayload, type LoginResponse } from "@/lib/api"
import { saveAuth, normalizeRole } from "@/lib/auth"

const roleTypes = [
  { value: "admin", label: "Administrador", description: "Acesso total ao sistema" },
  { value: "manager", label: "Gestor", description: "Gestão de programas e equipes" },
  { value: "coordinator", label: "Coordenador Regional", description: "Gestão de região específica" },
  { value: "support", label: "Suporte/Operações", description: "Atendimento e operações" },
]

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!formData.role) {
        setError("Selecione o perfil de acesso para continuar.")
        setIsLoading(false)
        return
      }

      const payload: LoginPayload = {
        login: normalizeEmail(formData.email),
        password: formData.password,
        role: formData.role as LoginPayload["role"],
      }

      const response = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const normalizedRole = normalizeRole(response.user.role)
      if (normalizedRole !== "admin") {
        throw new Error("Seu usuário não possui acesso administrativo.")
      }

      const userWithNormalizedRole = { ...response.user, role: normalizedRole }
      saveAuth(response.access_token, userWithNormalizedRole)
      navigate("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex flex-col items-center">
              <span className="text-2xl font-bold text-primary">Turma do Bem</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Pelo direito de sorrir
              </span>
            </Link>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Área Administrativa</CardTitle>
              <CardDescription>
                Acesso exclusivo para a equipe de gestão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@turmadobem.org.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Esconder senha" : "Mostrar senha"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil de acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger id="role" className="h-12">
                      <SelectValue placeholder="Selecione seu perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleTypes.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>

                {/* Forgot password */}
                <div className="text-center">
                  <Link
                    to="/admin/recuperar-senha"
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Back to main site */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary hover:underline">
              Voltar ao site principal
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Info */}
      <div className="hidden flex-1 bg-primary lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="mb-4 text-3xl font-bold">
            Painel de Gestão
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/90">
            Acompanhe métricas, gerencie programas e monitore o impacto 
            social da Turma do Bem em tempo real.
          </p>
          
          <div className="grid gap-4 text-left">
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <h3 className="font-semibold">Dashboard Executivo</h3>
              <p className="text-sm text-primary-foreground/80">
                Visualize KPIs, tendências e métricas de desempenho
              </p>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <h3 className="font-semibold">Análise Regional</h3>
              <p className="text-sm text-primary-foreground/80">
                Monitore cobertura e desempenho por região e estado
              </p>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <h3 className="font-semibold">Gestão de Programas</h3>
              <p className="text-sm text-primary-foreground/80">
                Compare resultados entre Dentistas, Apolônias e Psicólogos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
