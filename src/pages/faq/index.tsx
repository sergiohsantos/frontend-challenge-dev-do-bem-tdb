import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { BadgeCheck, HeartHandshake, HelpCircle, Phone, ShieldCheck } from "lucide-react"

const faqs = [
  {
    question: "O que é a Turma do Bem?",
    answer: "A Turma do Bem é uma organização sem fins lucrativos que conecta voluntários e beneficiários para ampliar o acesso ao cuidado odontológico gratuito e acompanhamento social.",
  },
  {
    question: "Quem pode ser beneficiário do Dentista do Bem?",
    answer: "Jovens de 11 a 17 anos em situação de vulnerabilidade social podem ser avaliados para atendimento. A elegibilidade depende da análise cadastral e dos documentos solicitados.",
  },
  {
    question: "Como faço meu cadastro?",
    answer: "O cadastro é feito pela plataforma. Após o envio das informações, a equipe avalia os dados e acompanha as próximas etapas da jornada.",
  },
  {
    question: "O tratamento é gratuito?",
    answer: "Sim. O atendimento oferecido pelos programas da Turma do Bem é gratuito para beneficiários aprovados, de acordo com os critérios e disponibilidade da rede voluntária.",
  },
  {
    question: "Como me tornar voluntário?",
    answer: "Profissionais interessados podem se cadastrar como voluntários, informar seus dados profissionais e aguardar a validação da equipe responsável.",
  },
  {
    question: "O que é o programa Apolônias do Bem?",
    answer: "É um programa voltado ao cuidado odontológico de mulheres cis e trans que tiveram a dentição afetada por situações de violência.",
  },
  {
    question: "Quanto tempo dura o tratamento?",
    answer: "O tempo varia conforme a necessidade de cada pessoa, o plano de atendimento e a disponibilidade da rede. A plataforma ajuda a acompanhar a continuidade da jornada.",
  },
  {
    question: "Posso escolher o profissional que vai me atender?",
    answer: "A indicação considera critérios como disponibilidade, região e necessidades do caso, buscando o melhor encaminhamento possível dentro da rede.",
  },
]

const supportCards = [
  { icon: ShieldCheck, title: "Informação segura", text: "As respostas orientam a jornada sem expor dados sensíveis." },
  { icon: HeartHandshake, title: "Acolhimento", text: "A linguagem prioriza clareza para quem busca atendimento ou deseja ajudar." },
  { icon: BadgeCheck, title: "Rede validada", text: "Voluntários e beneficiários seguem fluxos de cadastro, análise e acompanhamento." },
]

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="tdb-premium-shell relative overflow-hidden bg-primary py-16 text-primary-foreground sm:py-20 lg:py-24">
          <div className="tdb-orb left-[-5rem] top-12 h-72 w-72 bg-secondary" aria-hidden="true" />
          <div className="tdb-orb tdb-orb-delayed bottom-[-5rem] right-[-5rem] h-80 w-80 bg-accent" aria-hidden="true" />
          <div className="container relative mx-auto px-4 text-center tdb-reveal">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-foreground/10 text-accent backdrop-blur"><HelpCircle className="h-8 w-8" aria-hidden="true" /></div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Perguntas frequentes</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-primary-foreground/86 sm:text-lg">Respostas diretas para entender cadastro, programas, atendimento, voluntariado e próximos passos.</p>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <aside className="tdb-reveal lg:sticky lg:top-24">
                <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-xl shadow-primary/5 sm:p-6">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-accent">Central de orientação</p>
                  <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">Encontre a resposta certa antes de iniciar uma etapa.</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">A FAQ apoia beneficiários, famílias, voluntários e parceiros com informações claras e sem linguagem técnica.</p>
                  <div className="mt-6 flex items-center gap-3 rounded-2xl bg-primary/5 p-4"><Phone className="h-5 w-5 text-primary" aria-hidden="true" /><div><p className="text-sm font-black text-foreground">Atendimento TDB</p><a href="tel:08007777766" className="text-sm font-bold text-primary hover:underline">0800 777 7766</a></div></div>
                </div>

                <div className="mt-5 grid gap-3">
                  {supportCards.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                      <div className="flex items-start gap-3"><item.icon className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden="true" /><div><p className="font-black text-foreground">{item.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p></div></div>
                    </div>
                  ))}
                </div>
              </aside>

              <Card className="tdb-reveal tdb-reveal-delay-1 rounded-[2rem] shadow-xl shadow-primary/5">
                <CardContent className="p-4 sm:p-6">
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={faq.question} value={`item-${index}`} className="rounded-2xl border-b-0 px-2 transition-colors hover:bg-muted/40">
                        <AccordionTrigger className="text-left text-base font-black text-foreground hover:no-underline sm:text-lg">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-sm leading-7 text-muted-foreground sm:text-base">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}

