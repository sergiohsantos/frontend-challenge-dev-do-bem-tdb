import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"

export default function AdminRecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-success mb-4" />
            <h2 className="text-2xl font-bold">E-mail enviado!</h2>
            <p className="mt-2 text-muted-foreground">
              Se o e-mail estiver cadastrado, voce recebera instrucoes para redefinir sua senha.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/admin/login">Voltar ao login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Recuperar Senha</CardTitle>
          <CardDescription>Informe seu e-mail para receber as instrucoes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@turmadobem.org.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
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
          <div className="mt-4 text-center">
            <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 inline h-4 w-4" />
              Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
