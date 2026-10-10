import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ShieldCheck } from "lucide-react"

export default function AdminRecuperarSenhaPage() {
  return <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-background p-4">
    <Card className="w-full max-w-lg">
      <CardHeader><ShieldCheck className="mb-3 h-10 w-10 text-primary" aria-hidden="true" /><CardTitle><h1>Recuperar acesso administrativo</h1></CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p>Para recuperar seu acesso, entre em contato com a equipe responsável pela plataforma. Sua identidade e seu vínculo administrativo precisam ser confirmados.</p>
        <p className="text-sm text-muted-foreground">A recuperação automática por e-mail ainda não está disponível. Não compartilhe sua senha ou códigos de acesso no formulário de contato.</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to="/contato">Entrar em contato</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/login"><ArrowLeft className="h-4 w-4" />Voltar ao login</Link></Button>
        </div>
      </CardContent>
    </Card>
  </main>
}
