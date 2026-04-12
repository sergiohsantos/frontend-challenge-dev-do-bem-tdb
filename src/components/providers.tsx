import { I18nProvider } from "@/lib/i18n"
import { AccessibilityProvider } from "@/lib/accessibility"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="turma-do-bem-theme">
      <I18nProvider>
        <AccessibilityProvider>
          {children}
          <Toaster />
        </AccessibilityProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
