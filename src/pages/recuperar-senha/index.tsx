import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, User, Users, ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react"
import { HelpButton } from "@/components/layout/help-button"
import { AlertBanner } from "@/components/ui/alert-banner"
import { LanguageSwitcher } from "@/components/accessibility/language-switcher"
import { AccessibilityPanel } from "@/components/accessibility/accessibility-panel"

export default function RecuperarSenhaPage() {
  const [userType, setUserType] = useState<"beneficiario" | "voluntario">("beneficiario")
  const [formData, setFormData] = useState({
    email: "",
    cpf: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSuccess(true)
    } catch {
      setError("Erro ao processar solicitacao. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-success via-success/70 to-success" />
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-success/20 to-success/5 shadow-sm">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">E-mail enviado!</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Se o {userType === "beneficiario" ? "CPF" : "e-mail"} estiver cadastrado, voce recebera instrucoes para redefinir sua senha.
              </p>
              <Button className="mt-8 h-12 px-8" asChild>
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm transition-transform group-hover:scale-105">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Turma do Bem</span>
          </Link>
          <div className="flex items-center gap-2">
            <AccessibilityPanel />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Link>
          </Button>

          <Card className="overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />
            <CardHeader className="text-center pt-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 shadow-sm">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
              <CardDescription className="text-base">
                Informe seus dados para receber as instrucoes de recuperacao
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={userType} onValueChange={(v) => setUserType(v as "beneficiario" | "voluntario")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="beneficiario" className="gap-2">
                    <User className="h-4 w-4" />
                    Beneficiario
                  </TabsTrigger>
                  <TabsTrigger value="voluntario" className="gap-2">
                    <Users className="h-4 w-4" />
                    Voluntario
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <AlertBanner
                    type="error"
                    message={error}
                    dismissible
                    onDismiss={() => setError(null)}
                    className="mb-4"
                  />
                )}

                <TabsContent value="beneficiario">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => handleInputChange("cpf", e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Digite o CPF cadastrado na Turma do Bem
                      </p>
                    </div>
                    <Button type="submit" className="w-full h-12" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar instrucoes"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="voluntario">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Digite o e-mail cadastrado como voluntario
                      </p>
                    </div>
                    <Button type="submit" className="w-full h-12" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar instrucoes"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Card className="border-dashed bg-muted/30">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  Precisa de ajuda? Ligue{" "}
                  <a href="tel:08007777766" className="font-semibold text-primary hover:underline">
                    0800 777 7766
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
