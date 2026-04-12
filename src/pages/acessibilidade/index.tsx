import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Ear, Hand, Monitor, Keyboard, Volume2 } from "lucide-react"

export default function AcessibilidadePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12 lg:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Acessibilidade
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
              Nosso compromisso com a inclusao digital
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <p className="text-lg text-muted-foreground mb-8">
                A Turma do Bem esta comprometida em garantir que nosso site seja acessivel 
                a todas as pessoas, independentemente de suas habilidades ou deficiencias.
              </p>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <Eye className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Visao</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Alto contraste, ajuste de tamanho de fonte e compatibilidade com leitores de tela.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Ear className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Audicao</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Legendas em videos e alternativas textuais para conteudo de audio.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Hand className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Mobilidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Navegacao completa por teclado e areas de clique ampliadas.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Monitor className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Visual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Design responsivo e adaptavel a diferentes tamanhos de tela.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Keyboard className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Teclado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Atalhos de teclado e navegacao por tabs para todas as funcionalidades.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Volume2 className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Leitores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Compatibilidade total com leitores de tela e tecnologias assistivas.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 rounded-lg bg-muted p-6">
                <h2 className="text-xl font-semibold mb-4">Atalhos de Teclado</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><kbd className="px-2 py-1 bg-background rounded">Alt + 1</kbd> - Ir para o conteudo principal</li>
                  <li><kbd className="px-2 py-1 bg-background rounded">Alt + 2</kbd> - Ir para o menu de navegacao</li>
                  <li><kbd className="px-2 py-1 bg-background rounded">Alt + 3</kbd> - Ir para a busca</li>
                  <li><kbd className="px-2 py-1 bg-background rounded">Tab</kbd> - Navegar entre elementos</li>
                  <li><kbd className="px-2 py-1 bg-background rounded">Enter</kbd> - Ativar elemento focado</li>
                </ul>
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
