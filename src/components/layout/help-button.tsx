import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { HelpCircle, Phone, MessageCircle, FileQuestion, X, Accessibility } from "lucide-react"

const helpOptions = [
  {
    href: "tel:08007777766",
    icon: Phone,
    label: "Ligar agora",
    description: "0800 777 7766",
    external: true,
  },
  {
    href: "/faq",
    icon: FileQuestion,
    label: "Perguntas frequentes",
    description: "Tire suas dúvidas",
    external: false,
  },
  {
    href: "/contato",
    icon: MessageCircle,
    label: "Enviar mensagem",
    description: "Fale conosco",
    external: false,
  },
  {
    href: "/acessibilidade",
    icon: Accessibility,
    label: "Acessibilidade",
    description: "Opções de ajuda",
    external: false,
  },
]

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-24 right-4 z-50 sm:bottom-28 sm:right-6 md:bottom-28 md:right-8">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="h-12 w-12 rounded-full bg-accent text-accent-foreground shadow-lg transition-all hover:scale-105 hover:bg-accent/90 sm:h-14 sm:w-14 md:h-16 md:w-16"
            aria-label={isOpen ? "Fechar menu de ajuda" : "Precisa de ajuda?"}
          >
            {isOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" aria-hidden="true" />
            ) : (
              <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" aria-hidden="true" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="mb-2 w-64 p-2 sm:w-72"
          sideOffset={8}
        >
          <div className="space-y-1">
            <p className="px-3 py-2 text-sm font-semibold text-foreground">
              Como podemos ajudar?
            </p>
            {helpOptions.map((option) => {
              const content = (
                <span className="flex items-center gap-3 w-full">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <option.icon className="h-5 w-5 text-secondary-foreground" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </span>
                </span>
              )

              if (option.external) {
                return (
                  <a
                    key={option.href}
                    href={option.href}
                    className="flex min-h-14 items-center rounded-lg px-3 py-2 transition-colors hover:bg-secondary"
                    onClick={() => setIsOpen(false)}
                  >
                    {content}
                  </a>
                )
              }

              return (
                <Link
                  key={option.href}
                  to={option.href}
                  className="flex min-h-14 items-center rounded-lg px-3 py-2 transition-colors hover:bg-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  {content}
                </Link>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
