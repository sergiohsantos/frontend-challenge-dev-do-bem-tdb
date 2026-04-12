import { Link } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, Phone, User, LogIn, Accessibility, ChevronDown, Heart, Smile } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/accessibility/language-switcher"
import { AccessibilityPanel } from "@/components/accessibility/accessibility-panel"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { t, locale } = useI18n()

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/sobre", label: t.nav.about },
    { href: "/programas", label: t.nav.programs },
    { href: "/integrantes", label: (t.nav as { team?: string }).team || (locale === "pt-BR" ? "Integrantes" : "Team") },
    { href: "/faq", label: t.nav.faq },
    { href: "/contato", label: t.nav.contact },
  ]

  const registerOptions = [
    { href: "/cadastro/beneficiario", label: t.nav.registerBeneficiary || "Sou Beneficiario", icon: Heart },
    { href: "/cadastro/voluntario", label: t.nav.registerVolunteer || "Sou Voluntario", icon: Smile },
    { href: "/cadastro/apolonias", label: t.nav.registerApolonias || "Apolonias do Bem", icon: Heart },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:h-20">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          aria-label={t.header.logoAlt}
        >
          <div className="flex flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight text-primary lg:text-2xl">
              Turma do Bem
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-accent lg:text-xs">
              {t.header.tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label={t.nav.mainMenu}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {/* Accessibility Controls */}
          <AccessibilityPanel />
          <LanguageSwitcher />
          
          <div className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
          
          <Button variant="outline" size="default" asChild className="gap-2">
            <Link to="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t.nav.login}
            </Link>
          </Button>
          
          {/* Dropdown Cadastrar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="default" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <User className="h-4 w-4" aria-hidden="true" />
                {t.nav.register}
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {registerOptions.map((option) => (
                <DropdownMenuItem key={option.href} asChild>
                  <Link to={option.href} className="flex items-center gap-2 cursor-pointer">
                    <option.icon className="h-4 w-4 text-accent" aria-hidden="true" />
                    {option.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1 lg:hidden">
          <AccessibilityPanel />
          <LanguageSwitcher />
          
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12"
                aria-label={isOpen ? t.accessibility.closeMenu : t.accessibility.openMenu}
              >
                {isOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm p-0">
              <SheetTitle className="sr-only">{t.nav.mobileMenu}</SheetTitle>
              <SheetDescription className="sr-only">
                {t.nav.mainMenu}
              </SheetDescription>
              <div className="flex h-full flex-col">
                {/* Mobile Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div className="flex flex-col leading-none">
                    <span className="text-lg font-extrabold tracking-tight text-primary">
                      Turma do Bem
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-accent">
                      {t.header.tagline}
                    </span>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 overflow-auto p-4" aria-label={t.nav.mobileMenu}>
                  <ul className="space-y-2">
                    {navItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className="flex min-h-14 items-center rounded-xl px-4 text-lg font-medium text-foreground transition-colors hover:bg-secondary active:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                    {/* Accessibility Page Link */}
                    <li>
                      <Link
                        to="/acessibilidade"
                        onClick={() => setIsOpen(false)}
                        className="flex min-h-14 items-center gap-2 rounded-xl px-4 text-lg font-medium text-foreground transition-colors hover:bg-secondary active:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Accessibility className="h-5 w-5" aria-hidden="true" />
                        {t.nav.accessibility}
                      </Link>
                    </li>
                  </ul>
                </nav>

                {/* Mobile Actions */}
                <div className="border-t border-border p-4 space-y-3">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full h-14 text-base gap-2" 
                    asChild
                  >
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <LogIn className="h-5 w-5" aria-hidden="true" />
                      {t.nav.login}
                    </Link>
                  </Button>
                  
                  {/* Register Options Mobile */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                      {t.nav.register}
                    </p>
                    {registerOptions.map((option) => (
                      <Button 
                        key={option.href}
                        variant="secondary"
                        size="lg" 
                        className="w-full h-12 text-base gap-2 justify-start" 
                        asChild
                      >
                        <Link to={option.href} onClick={() => setIsOpen(false)}>
                          <option.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                          {option.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                  
                  <div className="pt-2">
                    <a
                      href="tel:08007777766"
                      className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {t.header.callUs}: 0800 777 7766
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
