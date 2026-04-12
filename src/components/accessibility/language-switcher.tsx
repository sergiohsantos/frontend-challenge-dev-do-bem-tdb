import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n, type Locale } from "@/lib/i18n"
import { Globe, Check } from "lucide-react"

const languages: { code: Locale; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português", flag: "BR" },
  { code: "en", label: "English", flag: "US" },
]

interface LanguageSwitcherProps {
  variant?: "default" | "outline" | "ghost"
  showLabel?: boolean
  className?: string
}

export function LanguageSwitcher({ 
  variant = "ghost", 
  showLabel = false,
  className 
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n()
  const currentLang = languages.find(l => l.code === locale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={showLabel ? "default" : "icon"}
          className={className}
          aria-label={t.accessibility.language}
        >
          <Globe className="h-5 w-5" aria-hidden="true" />
          {showLabel && (
            <span className="ml-2">{currentLang?.label}</span>
          )}
          <span className="sr-only">{t.accessibility.language}: {currentLang?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-6">
                {lang.flag}
              </span>
              <span>{lang.label}</span>
            </div>
            {locale === lang.code && (
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
