import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "O que e a Turma do Bem?",
    answer: "A Turma do Bem e uma organizacao sem fins lucrativos que conecta dentistas voluntarios a jovens em situacao de vulnerabilidade social, oferecendo tratamento odontologico gratuito."
  },
  {
    question: "Quem pode ser beneficiario do Dentista do Bem?",
    answer: "Jovens de 11 a 17 anos em situacao de vulnerabilidade social podem ser beneficiarios. E necessario apresentar documentacao comprobatoria durante o cadastro."
  },
  {
    question: "Como me cadastrar como beneficiario?",
    answer: "Acesse a pagina de cadastro, preencha o formulario com seus dados pessoais e aguarde a analise da equipe. Voce recebera um retorno em ate 30 dias."
  },
  {
    question: "O tratamento e realmente gratuito?",
    answer: "Sim, todo o tratamento odontologico e oferecido de forma gratuita pelos dentistas voluntarios cadastrados na Turma do Bem."
  },
  {
    question: "Como me tornar um dentista voluntario?",
    answer: "Acesse a pagina de cadastro de voluntarios, preencha seus dados profissionais e aguarde a aprovacao. Apos aprovado, voce podera atender beneficiarios em seu consultorio."
  },
  {
    question: "O que e o programa Apolonias do Bem?",
    answer: "O Apolonias do Bem oferece tratamento odontologico gratuito para mulheres vitimas de violencia domestica que tiveram seus dentes afetados."
  },
  {
    question: "Quanto tempo dura o tratamento?",
    answer: "O tempo varia de acordo com a necessidade de cada paciente. O acompanhamento e feito ate os 18 anos do beneficiario ou ate a conclusao do tratamento."
  },
  {
    question: "Posso escolher o dentista que vai me atender?",
    answer: "A alocacao e feita de acordo com a disponibilidade e proximidade geografica dos voluntarios, buscando sempre a melhor opcao para o beneficiario."
  },
]

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-10 sm:py-12 lg:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-primary-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              Perguntas Frequentes
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-primary-foreground/90 sm:mt-4 sm:text-lg">
              Encontre respostas para as duvidas mais comuns
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm sm:text-base">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed sm:text-base">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
