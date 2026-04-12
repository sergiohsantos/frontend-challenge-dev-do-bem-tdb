import { Github, Linkedin, Code2, Database, Bot } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export interface TeamMember {
  id: number
  name: string
  rm: string
  turma: string
  areas: string[]
  linkedinUrl: string
  githubUrl: string
  photoUrl: string
  bio: string
}

const TeamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Sérgio Henrique S",
    rm: "RM567254",
    turma: "1TDS Agosto",
    areas: ["Frontend", "Python", "IA Chatbot"],
    linkedinUrl: "https://www.linkedin.com/in/sergiohenriquessantos/",
    githubUrl: "https://github.com/sergiohsantos",
    photoUrl: "/team/Sergio.jpg",
    bio: "Atua em Frontend, Python e IA Chatbot, contribuindo com interface, experiência do usuário e evolução técnica da solução.",
  },
  {
    id: 2,
    name: "Icaro Nascimento",
    rm: "RM567386",
    turma: "1TDS Agosto",
    areas: ["Java", "Database", "Business Model"],
    linkedinUrl: "https://www.linkedin.com/in/icaronascimento-/",
    githubUrl: "https://github.com/IcaroNscS",
    photoUrl: "/team/Icaro.png",
    bio: "Atua em Java, banco de dados e business model, apoiando a estrutura técnica e estratégica do projeto.",
  },
]

function areaIcon(area: string) {
  const normalized = area.toLowerCase()
  if (normalized.includes("python") || normalized.includes("frontend")) return Code2
  if (normalized.includes("database")) return Database
  if (normalized.includes("ia") || normalized.includes("chatbot")) return Bot
  return Code2
}

export default function IntegrantesPage() {
  const { locale } = useI18n()
  const isPt = locale === "pt-BR"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="border-b bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-16 text-center sm:py-20">
            <Badge className="mb-4 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10">
              {isPt ? "Equipe do projeto" : "Project team"}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {isPt ? "Integrantes" : "Team Members"}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-primary-foreground/85 sm:text-lg">
              {isPt
                ? "Conheça os integrantes responsáveis pela construção da solução Dev do Bem e pela evolução da experiência digital da Turma do Bem."
                : "Meet the members responsible for building the Dev do Bem solution and improving the Turma do Bem digital experience."}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 sm:py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            {TeamMembers.map((member) => (
              <Card key={member.id} className="overflow-hidden border-border/80 shadow-sm">
                <CardHeader className="pb-0">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="h-36 w-36 rounded-2xl object-cover ring-1 ring-border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-2xl">{member.name}</CardTitle>
                        <Badge variant="outline">{member.rm}</Badge>
                      </div>
                      <CardDescription className="mt-2 text-sm">{member.turma}</CardDescription>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {member.areas.map((area) => {
                          const Icon = areaIcon(area)
                          return (
                            <Badge key={area} variant="secondary" className="gap-1 rounded-full px-3 py-1">
                              <Icon className="h-3.5 w-3.5" />
                              {area}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <p className="text-sm leading-6 text-muted-foreground">{member.bio}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" asChild>
                      <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    </Button>
                  </div>
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
