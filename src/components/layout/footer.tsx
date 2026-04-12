import { Link } from "react-router-dom"
import { Heart, Phone, Mail, Facebook, Instagram, Linkedin, Youtube } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const socialLinks = [
  { href: "https://facebook.com/turmadobem", icon: Facebook, label: "Facebook" },
  { href: "https://instagram.com/turmadobem", icon: Instagram, label: "Instagram" },
  { href: "https://linkedin.com/company/turmadobem", icon: Linkedin, label: "LinkedIn" },
  { href: "https://youtube.com/turmadobem", icon: Youtube, label: "YouTube" },
]

export function Footer() {
  const { t, locale } = useI18n()

  const footerLinks = {
    institucional: {
      title: locale === "pt-BR" ? "Institucional" : "About Us",
      links: [
        { href: "/sobre", label: locale === "pt-BR" ? "Sobre Nós" : "About Us" },
        { href: "/integrantes", label: locale === "pt-BR" ? "Integrantes" : "Team" },
        { href: "/programas", label: t.nav.programs },
        { href: "/comunicacao", label: locale === "pt-BR" ? "Comunicação" : "Communication" },
      ],
    },
    participar: {
      title: locale === "pt-BR" ? "Participar" : "Get Involved",
      links: [
        { href: "/cadastro/beneficiario", label: locale === "pt-BR" ? "Quero Participar" : "Join as Beneficiary" },
        { href: "/cadastro/voluntario", label: locale === "pt-BR" ? "Seja Voluntário" : "Become a Volunteer" },
        { href: "/cadastro/apolonias", label: locale === "pt-BR" ? "Apolônias do Bem" : "Apolonias do Bem" },
        { href: "/contato", label: locale === "pt-BR" ? "Fale Conosco" : "Talk to Us" },
      ],
    },
    ajuda: {
      title: t.common.help,
      links: [
        { href: "/faq", label: t.nav.faq },
        { href: "/contato", label: t.nav.contact },
        { href: "/acessibilidade", label: t.nav.accessibility },
        { href: "/privacidade", label: t.footer.privacyPolicy },
      ],
    },
  }

  return (
    <footer className="border-t border-border bg-card" role="contentinfo">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-3 sm:space-y-4">
            <Link to="/" className="flex flex-col leading-none" aria-label={t.header.logoAlt}>
              <span className="text-lg font-extrabold tracking-tight text-primary sm:text-xl">
                Turma do Bem
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-accent sm:text-[10px]">
                {t.header.tagline}
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t.footer.description}
            </p>
            {/* Social Links */}
            <div className="flex gap-2 pt-1 sm:gap-3 sm:pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10 sm:w-10"
                  aria-label={`${locale === "pt-BR" ? "Siga-nos no" : "Follow us on"} ${social.label} (${t.accessibility.newWindow})`}
                >
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Institucional */}
          <nav aria-label={footerLinks.institucional.title}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground sm:mb-4 sm:text-sm">
              {footerLinks.institucional.title}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.institucional.links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Participar */}
          <nav aria-label={footerLinks.participar.title}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground sm:mb-4 sm:text-sm">
              {footerLinks.participar.title}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.participar.links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Ajuda & Contato */}
          <div>
            <nav aria-label={footerLinks.ajuda.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground sm:mb-4 sm:text-sm">
                {footerLinks.ajuda.title}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
              {footerLinks.ajuda.links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              </ul>
            </nav>
            
            {/* Contact Info */}
            <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
              <a
                href="tel:08007777766"
                className="flex min-h-10 items-center gap-2 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:text-sm"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                0800 777 7766
              </a>
              <a
                href="mailto:contato@turmadobem.org.br"
                className="flex min-h-10 items-center gap-2 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:text-sm"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                contato@turmadobem.org.br
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-center sm:flex-row sm:gap-4 sm:py-6 sm:text-left">
          <p className="text-[10px] text-muted-foreground sm:text-xs">
            {t.footer.copyright.replace("{year}", new Date().getFullYear().toString())} CNPJ: 05.511.638/0001-00
          </p>
          <p className="text-[10px] text-muted-foreground sm:text-xs">
            {t.footer.madeWith} <Heart className="inline h-3 w-3 text-accent" aria-label={locale === "pt-BR" ? "amor" : "love"} /> {t.footer.forBrazil}
          </p>
        </div>
      </div>

      {/* Developer Credit */}
      <div className="border-t border-border/50 bg-background">
        <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-4">
          <span className="text-[9px] text-muted-foreground/70 sm:text-[10px]">
            {locale === "pt-BR" ? "Desenvolvido por" : "Developed by"}
          </span>
          <a
            href="https://devdobem.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Dev do Bem - Tecnologia Conectando Sorrisos"
          >
            <img
              src="/images/dev-do-bem-logo.png"
              alt="Dev do Bem"
              className="h-5 w-auto sm:h-6"
            />
          </a>
        </div>
      </div>
    </footer>
  )
}
