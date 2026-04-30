import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12 lg:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Politica de Privacidade
            </h1>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl prose prose-gray">
              <h2 className="text-xl font-semibold">1. Coleta de Dados</h2>
              <p className="text-muted-foreground">
                Coletamos informacoes que voce nos fornece diretamente, como nome, e-mail, telefone 
                e dados de saude necessarios para o tratamento odontologico.
              </p>

              <h2 className="text-xl font-semibold mt-8">2. Uso das Informacoes</h2>
              <p className="text-muted-foreground">
                Utilizamos suas informacoes para viabilizar o atendimento odontologico, comunicar sobre 
                consultas e tratamentos, e melhorar nossos servicos.
              </p>

              <h2 className="text-xl font-semibold mt-8">3. Compartilhamento</h2>
              <p className="text-muted-foreground">
                Suas informacoes sao compartilhadas apenas com os dentistas voluntarios responsaveis 
                pelo seu atendimento e equipe interna da Turma do Bem.
              </p>

              <h2 className="text-xl font-semibold mt-8">4. Seguranca</h2>
              <p className="text-muted-foreground">
                Implementamos medidas de seguranca tecnicas e organizacionais para proteger suas 
                informacoes contra acesso nao autorizado, alteracao ou destruicao.
              </p>

              <h2 className="text-xl font-semibold mt-8">5. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground">
                Voce tem direito a acessar, corrigir, excluir ou portar seus dados pessoais. 
                Entre em contato conosco para exercer esses direitos.
              </p>

              <h2 className="text-xl font-semibold mt-8">6. Cookies</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies para melhorar sua experiencia no site. Voce pode gerenciar 
                suas preferencias de cookies nas configuracoes do navegador.
              </p>

              <h2 className="text-xl font-semibold mt-8">7. Contato</h2>
              <p className="text-muted-foreground">
                Para questoes relacionadas a privacidade, entre em contato pelo e-mail 
                privacidade@turmadobem.org.br ou pelo telefone 0800 777 7766.
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
