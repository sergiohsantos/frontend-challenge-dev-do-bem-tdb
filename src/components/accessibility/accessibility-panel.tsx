import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAccessibility, type FontSize } from "@/lib/accessibility/context"
import { Accessibility, Contrast, RotateCcw, Type, Zap } from "lucide-react"

interface AccessibilityPanelProps {
  variant?: "default" | "outline" | "ghost"
  className?: string
}

const fontSizeOptions: { value: FontSize; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
  { value: "extra-large", label: "Extra grande" },
]

export function AccessibilityPanel({ variant = "ghost", className }: AccessibilityPanelProps) {
  const { fontSize, setFontSize, highContrast, setHighContrast, reducedMotion, setReducedMotion, resetPreferences } = useAccessibility()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="icon" className={className} aria-label="Opções de acessibilidade">
          <Accessibility className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Opções de acessibilidade</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-4">
        <DropdownMenuLabel className="flex items-center gap-2 text-base font-semibold">
          <Accessibility className="h-5 w-5 text-primary" aria-hidden="true" />
          Acessibilidade
        </DropdownMenuLabel>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">
          Ajuste a leitura e a navegação conforme sua necessidade.
        </p>
        <DropdownMenuSeparator />

        <div className="py-3">
          <div className="mb-3 flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Label className="text-sm font-medium">Tamanho da fonte</Label>
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Tamanho da fonte">
            {fontSizeOptions.map((option) => (
              <Button key={option.value} variant={fontSize === option.value ? "default" : "outline"} size="sm" onClick={() => setFontSize(option.value)} className="flex-1 text-xs" role="radio" aria-checked={fontSize === option.value}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Contrast className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <Label htmlFor="high-contrast" className="cursor-pointer text-sm font-medium">Alto contraste</Label>
              <p className="text-xs text-muted-foreground">Aumenta o contraste visual da interface.</p>
            </div>
          </div>
          <Switch id="high-contrast" checked={highContrast} onCheckedChange={setHighContrast} />
        </div>

        <DropdownMenuSeparator />

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <Label htmlFor="reduced-motion" className="cursor-pointer text-sm font-medium">Reduzir animações</Label>
              <p className="text-xs text-muted-foreground">Diminui movimentos e transições da tela.</p>
            </div>
          </div>
          <Switch id="reduced-motion" checked={reducedMotion} onCheckedChange={setReducedMotion} />
        </div>

        <DropdownMenuSeparator />

        <Button variant="ghost" size="sm" onClick={resetPreferences} className="mt-2 w-full text-muted-foreground hover:text-foreground">
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Restaurar preferências
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
