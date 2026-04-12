import { HeartHandshake, Smile, Users, Target, Sparkles, ShieldCheck } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

export default function SobrePage() {
  const { locale } = useI18n()
  const isPt = locale === "pt-BR"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary to-primary/95 text-primary-foreground">
          <div className="container mx-auto grid gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge className="mb-4 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10">
                {isPt ? "Sobre o projeto" : "About the project"}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {isPt ? "Dev do Bem" : "Dev do Bem"}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/85 sm:text-lg">
                {isPt
                  ? "Uma solução digital criada para aproximar tecnologia, impacto social e cuidado humano, fortalecendo o ecossistema da Turma do Bem com uma experiência mais organizada, acessível e acolhedora."
                  : "A digital solution created to connect technology, social impact, and human care, strengthening the Turma do Bem ecosystem with a more organized, accessible, and welcoming experience."}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-4">
                  <p className="text-sm font-medium">{isPt ? "Propósito" : "Purpose"}</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">
                    {isPt ? "Conectar beneficiários, voluntários e administração em uma jornada clara e eficiente." : "Connect beneficiaries, volunteers, and administration in a clear and efficient journey."}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-4">
                  <p className="text-sm font-medium">{isPt ? "Foco" : "Focus"}</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">
                    {isPt ? "Melhorar usabilidade, comunicação interna, prontuários e acompanhamento de casos." : "Improve usability, internal communication, medical records, and case follow-up."}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src="/images/dev-do-bem-logo.png"
                alt="Dev do Bem"
                className="max-h-[360px] w-full max-w-[340px] object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 sm:py-16">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                icon: HeartHandshake,
                title: isPt ? "Impacto social" : "Social impact",
                description: isPt ? "Apoia a missão da Turma do Bem ao facilitar o cuidado contínuo de crianças, adolescentes e mulheres em situação de vulnerabilidade." : "Supports Turma do Bem's mission by facilitating continuous care for vulnerable children, adolescents, and women.",
              },
              {
                icon: Users,
                title: isPt ? "Experiência integrada" : "Integrated experience",
                description: isPt ? "Une beneficiário, voluntário e administração em uma plataforma mais clara, com regras de negócio alinhadas ao fluxo real." : "Brings beneficiaries, volunteers, and administration together in a clearer platform aligned with real workflows.",
              },
              {
                icon: Smile,
                title: isPt ? "Cuidado com a jornada" : "Journey care",
                description: isPt ? "Melhora mensagens, notificações, prontuários, aprovações e agendamentos para reduzir fricção operacional." : "Improves messaging, notifications, records, approvals, and scheduling to reduce operational friction.",
              },
              {
                icon: Target,
                title: isPt ? "Objetivo do produto" : "Product goal",
                description: isPt ? "Transformar a experiência digital em algo funcional, responsivo e fiel às necessidades reais da ONG." : "Transform the digital experience into something functional, responsive, and faithful to the NGO's real needs.",
              },
              {
                icon: ShieldCheck,
                title: isPt ? "Organização e confiança" : "Organization and trust",
                description: isPt ? "Centraliza informações importantes com mais previsibilidade para usuários e equipe administrativa." : "Centralizes important information with more predictability for users and administrative teams.",
              },
              {
                icon: Sparkles,
                title: isPt ? "Evolução contínua" : "Continuous evolution",
                description: isPt ? "Foi pensado para permitir melhorias incrementais sem quebrar o que já funciona no frontend e no backend." : "Designed to allow incremental improvements without breaking what already works in the frontend and backend.",
              },
            ].map((item) => (
              <Card key={item.title} className="h-full">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="grid gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-primary">{isPt ? "Frontend" : "Frontend"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{isPt ? "React + Vite com foco em responsividade, componentes reutilizáveis e experiência consistente." : "React + Vite focused on responsiveness, reusable components, and a consistent experience."}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{isPt ? "Backend" : "Backend"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{isPt ? "Integração orientada pelos contratos reais já existentes, preservando regras de negócio importantes." : "Integration driven by existing real contracts, preserving important business rules."}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{isPt ? "Resultado esperado" : "Expected result"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{isPt ? "Uma plataforma mais fiel ao processo real da ONG, com melhor usabilidade para todos os perfis." : "A platform more faithful to the NGO's real process, with better usability for all profiles."}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
