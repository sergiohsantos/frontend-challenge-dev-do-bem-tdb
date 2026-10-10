import { HeartHandshake, Layers3, Route, ShieldCheck, Smile, Users } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const highlights = [
  { icon: HeartHandshake, title: "Cuidado com continuidade", description: "A jornada conecta cadastro, documentos, triagem, consulta, mensagens e notificações em um fluxo compreensível." },
  { icon: Users, title: "Rede integrada", description: "Beneficiários, voluntários e equipe TDB compartilham contexto sem perder a separação correta de cada perfil." },
  { icon: Route, title: "Próximo passo visível", description: "A plataforma deixa claro o que está acontecendo agora e qual ação precisa ser tomada." },
  { icon: ShieldCheck, title: "Operação confiável", description: "As informações importantes ficam centralizadas, com acesso protegido e experiência consistente." },
  { icon: Layers3, title: "Processos organizados", description: "Acompanhamento de casos, aprovações, agenda e comunicação ganham uma base digital mais fluida." },
  { icon: Smile, title: "Impacto humano", description: "A tecnologia existe para aproximar cuidado, presença e acolhimento até o sorriso acontecer." },
]

export default function SobrePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="tdb-premium-shell relative overflow-hidden bg-primary text-primary-foreground">
          <div className="tdb-orb left-[-5rem] top-10 h-72 w-72 bg-secondary" aria-hidden="true" />
          <div className="tdb-orb tdb-orb-delayed bottom-[-4rem] right-[-5rem] h-80 w-80 bg-accent" aria-hidden="true" />
          <div className="container relative mx-auto grid gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
            <div className="tdb-reveal">
              <Badge className="mb-5 rounded-full bg-primary-foreground/10 px-4 py-2 text-primary-foreground hover:bg-primary-foreground/10">Sobre o Dev do Bem</Badge>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-7xl">Uma jornada digital para aproximar cuidado, rede e presença.</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-primary-foreground/85 sm:text-lg">O Dev do Bem organiza a experiência da Turma do Bem para que cada pessoa encontre orientação, comunicação e acompanhamento no momento certo.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur"><p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Missão</p><p className="mt-3 text-sm leading-6 text-primary-foreground/82">Conectar pessoas e etapas com clareza, acolhimento e continuidade.</p></div>
                <div className="rounded-[2rem] border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur"><p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Operação</p><p className="mt-3 text-sm leading-6 text-primary-foreground/82">Fortalecer agenda, documentos, mensagens, notificações e acompanhamento de casos.</p></div>
              </div>
            </div>
            <div className="tdb-reveal tdb-reveal-delay-2 flex justify-center">
              <div className="tdb-glass rounded-[2.5rem] p-8"><img src="/images/dev-do-bem-logo.png" alt="Dev do Bem" className="max-h-[360px] w-full max-w-[340px] object-contain drop-shadow-2xl" /></div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14 sm:py-18 lg:py-24">
          <div className="mx-auto max-w-3xl text-center tdb-reveal">
            <span className="inline-flex rounded-full bg-accent/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.22em] text-accent">Como a plataforma atua</span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">A tecnologia trabalha para deixar o cuidado mais simples de acompanhar.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {highlights.map((item, index) => (
              <Card key={item.title} className={`tdb-polished-card tdb-reveal tdb-reveal-delay-${Math.min(index + 1, 3)} h-full rounded-[2rem]`}>
                <CardContent className="p-6">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><item.icon className="h-7 w-7" aria-hidden="true" /></div>
                  <h3 className="text-xl font-black tracking-tight text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16 lg:pb-24">
          <Card className="overflow-hidden rounded-[2.25rem] border-primary/20 bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
            <CardContent className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
              <div><p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Experiência</p><p className="mt-3 text-sm leading-7 text-primary-foreground/82">Interface clara, responsiva e preparada para diferentes perfis de uso.</p></div>
              <div><p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Integração</p><p className="mt-3 text-sm leading-7 text-primary-foreground/82">Informações conectadas para apoiar a equipe em cada etapa do atendimento.</p></div>
              <div><p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Continuidade</p><p className="mt-3 text-sm leading-7 text-primary-foreground/82">Acompanhamento da jornada com mensagens, documentos, consultas e notificações.</p></div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}

