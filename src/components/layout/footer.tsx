import { Link } from "react-router-dom"
import { Heart, Phone, Mail, Facebook, Instagram, Linkedin, Youtube } from "lucide-react"

const socialLinks = [
  { href: "https://facebook.com/turmadobem", icon: Facebook, label: "Facebook" },
  { href: "https://instagram.com/turmadobem", icon: Instagram, label: "Instagram" },
  { href: "https://linkedin.com/company/turmadobem", icon: Linkedin, label: "LinkedIn" },
  { href: "https://youtube.com/turmadobem", icon: Youtube, label: "YouTube" },
]

const footerLinks = [
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Sobre Nós" },
      { href: "/integrantes", label: "Integrantes" },
      { href: "/programas", label: "Programas" },
      { href: "/comunicacao", label: "Comunicação" },
    ],
  },
  {
    title: "Participar",
    links: [
      { href: "/cadastro/beneficiario", label: "Quero Participar" },
      { href: "/cadastro/voluntario", label: "Seja Voluntário" },
      { href: "/cadastro/apolonias", label: "Apolônias do Bem" },
      { href: "/contato", label: "Fale Conosco" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contato", label: "Contato" },
      { href: "/acessibilidade", label: "Acessibilidade" },
      { href: "/privacidade", label: "Política de Privacidade" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card" role="contentinfo">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 sm:space-y-4">
            <Link to="/" className="flex flex-col leading-none" aria-label="Turma do Bem - Pelo direito de sorrir">
              <span className="text-lg font-extrabold tracking-tight text-primary sm:text-xl">Turma do Bem</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-accent sm:text-[10px]">Pelo direito de sorrir</span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              A maior rede de voluntariado odontológico especializado do mundo. Transformando sorrisos e vidas com tecnologia, cuidado e comunicação.
            </p>
            <div className="flex gap-2 pt-1 sm:gap-3 sm:pt-2">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10 sm:w-10" aria-label={`Siga-nos no ${social.label}`}>
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground sm:mb-4 sm:text-sm">{group.title}</h3>
              <ul className="space-y-2 sm:space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}><Link to={link.href} className="rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm">{link.label}</Link></li>
                ))}
              </ul>
              {group.title === "Ajuda" ? (
                <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                  <a href="tel:08007777766" className="flex min-h-10 items-center gap-2 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:text-sm"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" />0800 777 7766</a>
                  <a href="mailto:contato@turmadobem.org.br" className="flex min-h-10 items-center gap-2 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:text-sm"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />contato@turmadobem.org.br</a>
                </div>
              ) : null}
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-border bg-muted/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-center sm:flex-row sm:gap-4 sm:py-6 sm:text-left">
          <p className="text-[10px] text-muted-foreground sm:text-xs">© {new Date().getFullYear()} Turma do Bem. Todos os direitos reservados. CNPJ: 05.511.638/0001-00</p>
          <p className="text-[10px] text-muted-foreground sm:text-xs">Feito com <Heart className="inline h-3 w-3 text-accent" aria-label="amor" /> para o Brasil</p>
        </div>
      </div>
      <div className="border-t border-border/50 bg-background">
        <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-4">
          <span className="text-[9px] text-muted-foreground sm:text-[10px]">Desenvolvido por</span>
          <a href="https://devdobem.com.br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring" aria-label="Dev do Bem - Tecnologia Conectando Sorrisos"><img src="/images/dev-do-bem-logo.png" alt="Dev do Bem" className="h-5 w-auto sm:h-6" /></a>
        </div>
      </div>
    </footer>
  )
}

