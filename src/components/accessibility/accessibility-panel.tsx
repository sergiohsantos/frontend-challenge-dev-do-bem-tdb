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
import { useAccessibility, type FontSize } from "@/lib/accessibility"
import { useI18n } from "@/lib/i18n"
import { Accessibility, RotateCcw, Type, Contrast, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccessibilityPanelProps {
  variant?: "default" | "outline" | "ghost"
  className?: string
}

const fontSizeOptions: { value: FontSize; labelKey: "fontSizeNormal" | "fontSizeLarge" | "fontSizeExtraLarge" }[] = [
  { value: "normal", labelKey: "fontSizeNormal" },
  { value: "large", labelKey: "fontSizeLarge" },
  { value: "extra-large", labelKey: "fontSizeExtraLarge" },
]

export function AccessibilityPanel({ 
  variant = "ghost",
  className 
}: AccessibilityPanelProps) {
  const { 
    fontSize, 
    setFontSize, 
    highContrast, 
    setHighContrast, 
    reducedMotion, 
    setReducedMotion,
    resetPreferences 
  } = useAccessibility()
  const { t } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size="icon"
          className={className}
          aria-label={t.accessibility.accessibilityOptions}
        >
          <Accessibility className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">{t.accessibility.accessibilityOptions}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-4">
        <DropdownMenuLabel className="flex items-center gap-2 text-base font-semibold">
          <Accessibility className="h-5 w-5 text-primary" aria-hidden="true" />
          {t.accessibility.title}
        </DropdownMenuLabel>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          {t.accessibility.description}
        </p>
        <DropdownMenuSeparator />
        
        {/* Font Size */}
        <div className="py-3">
          <div className="flex items-center gap-2 mb-3">
            <Type className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Label className="text-sm font-medium">{t.accessibility.fontSize}</Label>
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label={t.accessibility.fontSize}>
            {fontSizeOptions.map((option) => (
              <Button
                key={option.value}
                variant={fontSize === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFontSize(option.value)}
                className="flex-1 text-xs"
                role="radio"
                aria-checked={fontSize === option.value}
              >
                {t.accessibility[option.labelKey]}
              </Button>
            ))}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* High Contrast */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Contrast className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <Label htmlFor="high-contrast" className="text-sm font-medium cursor-pointer">
                {t.accessibility.highContrast}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t.accessibility.highContrastDescription}
              </p>
            </div>
          </div>
          <Switch
            id="high-contrast"
            checked={highContrast}
            onCheckedChange={setHighContrast}
            aria-describedby="high-contrast-desc"
          />
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Reduced Motion */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <Label htmlFor="reduced-motion" className="text-sm font-medium cursor-pointer">
                {t.accessibility.reducedMotion}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t.accessibility.reducedMotionDescription}
              </p>
            </div>
          </div>
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={setReducedMotion}
            aria-describedby="reduced-motion-desc"
          />
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Reset */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetPreferences}
          className="w-full mt-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
          {t.accessibility.resetPreferences}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
