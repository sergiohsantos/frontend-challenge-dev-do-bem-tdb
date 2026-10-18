import { createContext, useContext } from "react"

export type FontSize = "normal" | "large" | "extra-large"

export type ContrastMode = "normal" | "high"

export interface AccessibilityContextType {
  // Font size
  fontSize: FontSize
  setFontSize: (size: FontSize) => void

  // High contrast
  highContrast: boolean
  setHighContrast: (enabled: boolean) => void

  // Reduced motion
  reducedMotion: boolean
  setReducedMotion: (enabled: boolean) => void

  // Reset all preferences
  resetPreferences: () => void
}

export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}
