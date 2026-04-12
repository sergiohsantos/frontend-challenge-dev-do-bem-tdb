import { Link } from "react-router-dom"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MessageCircle, FileQuestion, Users, Heart } from "lucide-react"

export default function AjudaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12 lg:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Central de Ajuda
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
              Estamos aqui para ajudar voce
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <Phone className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Telefone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Ligue gratuitamente para nossa central de atendimento
                    </p>
                    <a href="tel:08007777766" className="text-2xl font-bold text-primary">
                      0800 777 7766
                    </a>
                    <p className="text-sm text-muted-foreground mt-2">
                      Segunda a sexta, das 8h as 18h
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Mail className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>E-mail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Envie sua duvida por e-mail
                    </p>
                    <a href="mailto:contato@turmadobem.org.br" className="text-primary font-medium hover:underline">
                      contato@turmadobem.org.br
                    </a>
                    <p className="text-sm text-muted-foreground mt-2">
                      Respondemos em ate 48 horas uteis
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <FileQuestion className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Perguntas Frequentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Encontre respostas para as duvidas mais comuns
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/faq">Ver FAQ</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <MessageCircle className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Contato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Entre em contato pelo formulario
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/contato">Enviar Mensagem</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-2">
                <Card className="bg-primary/5">
                  <CardHeader>
                    <Heart className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Para Beneficiarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Como me cadastrar?</li>
                      <li>Quais documentos preciso?</li>
                      <li>Como acompanhar meu tratamento?</li>
                    </ul>
                    <Button asChild className="mt-4" size="sm">
                      <Link to="/cadastro/beneficiario">Cadastrar</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5">
                  <CardHeader>
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Para Voluntarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Como me tornar voluntario?</li>
                      <li>Quais os requisitos?</li>
                      <li>Como funciona o atendimento?</li>
                    </ul>
                    <Button asChild className="mt-4" size="sm">
                      <Link to="/cadastro/voluntario">Seja Voluntario</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
