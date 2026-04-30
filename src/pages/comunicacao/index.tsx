import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Newspaper, Video, Image, FileText } from "lucide-react"

export default function ComunicacaoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12 lg:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Comunicacao
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
              Noticias, materiais e informacoes da Turma do Bem
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <Newspaper className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Noticias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Acompanhe as ultimas noticias e novidades sobre nossos programas e acoes.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Video className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Assista depoimentos, documentarios e materiais em video sobre a Turma do Bem.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Image className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Galeria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Veja fotos de nossos eventos, acoes e historias de transformacao.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <FileText className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Relatorios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Acesse nossos relatorios de atividades e prestacao de contas.
                    </p>
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
