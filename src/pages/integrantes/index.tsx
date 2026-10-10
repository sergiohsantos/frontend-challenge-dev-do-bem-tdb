import { Github, Linkedin, Code2, Database, Bot, ShieldCheck, Sparkles, HeartHandshake, Cloud, FileText, ServerCog } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const member = {
  name: "Sérgio Henrique Santos",
  rm: "RM567254",
  turma: "1TDSPS",
  role: "Arquitetura, desenvolvimento e sustentação do projeto",
  linkedinUrl: "https://www.linkedin.com/in/sergiohenriquessantos/",
  githubUrl: "https://github.com/sergiohsantos",
  photoUrl: "/team/Sergio.jpg",
  bio: "Especialista em Cloud, SRE e DevOps, com experiência em infraestrutura crítica, Kubernetes, AWS, Azure, automação, observabilidade e sustentação de ambientes corporativos. No Dev do Bem, atua de ponta a ponta: arquitetura, backend, frontend, banco de dados, IA, UX e operação da solução.",
}

const areas = [
  {
    label: "Front-end Design Engineering",
    short: "React, Vite, TypeScript e UX/UI",
    icon: Code2,
    description: "Construção da interface web, rotas, formulários, acessibilidade, dashboards e experiência visual da plataforma.",
  },
  {
    label: "Computational Thinking Using Python",
    short: "FastAPI e backend core",
    icon: ServerCog,
    description: "API principal do projeto, com autenticação, consultas, documentos, mensagens, notificações e regras do beneficiário.",
  },
  {
    label: "Domain Driven Design Using Java",
    short: "Java, Quarkus e Oracle",
    icon: Code2,
    description: "Backend de triagem, onboarding, CRM e fluxos administrativos, modelado com foco em domínio e regras de negócio.",
  },
  {
    label: "Building Relational Database",
    short: "Modelagem e Oracle SQL",
    icon: Database,
    description: "Estrutura relacional, DDL, DML, constraints, relacionamentos, dados de massa, views e documentação do banco.",
  },
  {
    label: "AI, Chatbot & Cognitive Services",
    short: "IA, no-show e assistente",
    icon: Bot,
    description: "Predição de risco de falta, apoio à decisão, chatbot e recursos cognitivos conectados à jornada de atendimento.",
  },
  {
    label: "Software Engineering & Business Model",
    short: "Produto, requisitos e documentação",
    icon: FileText,
    description: "Organização da proposta, personas, fluxos, regras, documentação, visão de produto e sustentação da entrega.",
  },
  {
    label: "Cloud, DevOps e Observabilidade",
    short: "AWS, Azure, Docker e monitoramento",
    icon: Cloud,
    description: "Deploy, infraestrutura, containers, operação, logs, métricas, esteiras e práticas de sustentação aplicadas ao projeto.",
  },
  {
    label: "Segurança e LGPD",
    short: "Acesso, perfis e dados sensíveis",
    icon: ShieldCheck,
    description: "Cuidados com autenticação, separação por perfil, exposição mínima de dados e experiência segura para usuários.",
  },
]

const pillars = [
  {
    title: "Visão prática",
    description: "O projeto foi conduzido com foco em resolver fluxos reais: cadastro, triagem, consulta, comunicação e acompanhamento.",
  },
  {
    title: "Arquitetura ponta a ponta",
    description: "Frontend, APIs, banco de dados, IA, documentação e operação foram tratados como partes da mesma jornada.",
  },
  {
    title: "Base profissional",
    description: "A experiência em Cloud, SRE, DevOps e infraestrutura sustenta decisões técnicas, segurança e continuidade da solução.",
  },
]

export default function IntegrantesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="relative overflow-hidden border-b bg-primary text-primary-foreground">
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-accent blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-secondary blur-3xl" />
          </div>
          <div className="container relative mx-auto grid gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge className="mb-5 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-primary-foreground hover:bg-primary-foreground/10">
                Responsável técnico
              </Badge>
              <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Uma entrega sustentada por arquitetura, execução e responsabilidade técnica.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/85 sm:text-lg">
                O Dev do Bem é conduzido por Sérgio Henrique Santos, unindo experiência profissional em Cloud, SRE, DevOps e infraestrutura com a construção acadêmica da solução na FIAP.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-accent px-6 text-accent-foreground hover:bg-accent/90">
                  <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
                <Button variant="outline" asChild className="rounded-full border-primary-foreground/30 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10">
                  <a href={member.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground shadow-2xl shadow-primary/30 backdrop-blur">
              <CardContent className="p-0">
                <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
                  <img src={member.photoUrl} alt={member.name} className="h-full min-h-[260px] w-full object-cover" />
                  <div className="p-6 sm:p-8">
                    <Badge className="mb-4 rounded-full bg-accent text-accent-foreground hover:bg-accent">{member.rm}</Badge>
                    <h2 className="text-3xl font-bold">{member.name}</h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-primary-foreground/65">{member.turma}</p>
                    <p className="mt-4 text-base font-medium text-primary-foreground">{member.role}</p>
                    <p className="mt-4 text-sm leading-6 text-primary-foreground/78">{member.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <Card className="border-primary/15 bg-primary/5">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <HeartHandshake className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">Responsável pelo projeto</p>
                    <h2 className="text-2xl font-bold text-foreground">Sérgio Henrique Santos</h2>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">
                  A sustentação do Dev do Bem envolve decisões de produto, arquitetura, implementação, integração com APIs, modelagem de dados, documentação e refinamento da experiência para beneficiários, voluntários e equipe TDB.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {areas.map((area) => (
                <Card key={area.label} title={area.description} className="group border-border/80 transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/10 focus-within:border-primary/25">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-focus-within:bg-primary group-focus-within:text-primary-foreground">
                        <area.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{area.label}</span>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{area.short}</p>
                      </div>
                    </div>
                    <div className="mt-0 max-h-0 overflow-hidden rounded-2xl border border-transparent bg-muted/40 px-4 text-sm leading-6 text-muted-foreground opacity-0 transition-all duration-300 group-hover:mt-4 group-hover:max-h-40 group-hover:border-border group-hover:py-3 group-hover:opacity-100 group-focus-within:mt-4 group-focus-within:max-h-40 group-focus-within:border-border group-focus-within:py-3 group-focus-within:opacity-100">
                      {area.description}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="h-full border-border/80 bg-card/90">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}

