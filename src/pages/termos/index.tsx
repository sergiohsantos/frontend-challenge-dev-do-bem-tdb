import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"

export default function TermosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12 lg:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Termos de Uso
            </h1>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl prose prose-gray">
              <h2 className="text-xl font-semibold">1. Aceitacao dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e usar este site, voce aceita e concorda em cumprir estes termos e condicoes de uso.
              </p>

              <h2 className="text-xl font-semibold mt-8">2. Uso do Site</h2>
              <p className="text-muted-foreground">
                O conteudo deste site e destinado ao uso pessoal e nao comercial. Voce nao pode modificar, copiar, 
                distribuir, transmitir, exibir, executar, reproduzir, publicar, licenciar ou criar trabalhos derivados.
              </p>

              <h2 className="text-xl font-semibold mt-8">3. Cadastro</h2>
              <p className="text-muted-foreground">
                Ao se cadastrar, voce concorda em fornecer informacoes verdadeiras, precisas, atuais e completas. 
                Voce e responsavel por manter a confidencialidade de sua conta.
              </p>

              <h2 className="text-xl font-semibold mt-8">4. Privacidade</h2>
              <p className="text-muted-foreground">
                Sua privacidade e importante para nos. Consulte nossa Politica de Privacidade para entender 
                como coletamos, usamos e protegemos suas informacoes.
              </p>

              <h2 className="text-xl font-semibold mt-8">5. Limitacao de Responsabilidade</h2>
              <p className="text-muted-foreground">
                A Turma do Bem nao sera responsavel por quaisquer danos diretos, indiretos, incidentais, 
                especiais ou consequentes resultantes do uso ou incapacidade de uso deste site.
              </p>

              <h2 className="text-xl font-semibold mt-8">6. Alteracoes</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alteracoes 
                entrarao em vigor imediatamente apos a publicacao no site.
              </p>

              <h2 className="text-xl font-semibold mt-8">7. Contato</h2>
              <p className="text-muted-foreground">
                Em caso de duvidas sobre estes termos, entre em contato pelo e-mail contato@turmadobem.org.br 
                ou pelo telefone 0800 777 7766.
              </p>

              <p className="text-sm text-muted-foreground mt-8">
                Ultima atualizacao: Janeiro de 2024
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
