import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

type FontSize = "normal" | "large" | "extra-large"
type ContrastMode = "normal" | "high"

interface AccessibilityContextType {
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

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

const STORAGE_KEY = "tdb-accessibility"

interface StoredPreferences {
  fontSize: FontSize
  highContrast: boolean
  reducedMotion: boolean
}

const defaultPreferences: StoredPreferences = {
  fontSize: "normal",
  highContrast: false,
  reducedMotion: false,
}

function applyFontSize(size: FontSize) {
  const root = document.documentElement
  root.classList.remove("font-size-normal", "font-size-large", "font-size-extra-large")
  root.classList.add(`font-size-${size}`)
}

function applyHighContrast(enabled: boolean) {
  const root = document.documentElement
  if (enabled) {
    root.classList.add("high-contrast")
  } else {
    root.classList.remove("high-contrast")
  }
}

function applyReducedMotion(enabled: boolean) {
  const root = document.documentElement
  if (enabled) {
    root.classList.add("reduce-motion")
  } else {
    root.classList.remove("reduce-motion")
  }
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("normal")
  const [highContrast, setHighContrastState] = useState(false)
  const [reducedMotion, setReducedMotionState] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Load stored preferences
    let loadedFontSize: FontSize = "normal"
    let loadedHighContrast = false
    let loadedReducedMotion = false
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const prefs: StoredPreferences = JSON.parse(stored)
        loadedFontSize = prefs.fontSize || "normal"
        loadedHighContrast = prefs.highContrast || false
        loadedReducedMotion = prefs.reducedMotion || false
      }
    } catch {
      // Use defaults
    }

    // Check system preference for reduced motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motionQuery.matches && !localStorage.getItem(STORAGE_KEY)) {
      loadedReducedMotion = true
    }
    
    // Apply all preferences
    setFontSizeState(loadedFontSize)
    setHighContrastState(loadedHighContrast)
    setReducedMotionState(loadedReducedMotion)
    
    applyFontSize(loadedFontSize)
    applyHighContrast(loadedHighContrast)
    applyReducedMotion(loadedReducedMotion)
  }, [])

  const savePreferences = useCallback((prefs: StoredPreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [])

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size)
    applyFontSize(size)
    savePreferences({ fontSize: size, highContrast, reducedMotion })
  }, [highContrast, reducedMotion, savePreferences])

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled)
    applyHighContrast(enabled)
    savePreferences({ fontSize, highContrast: enabled, reducedMotion })
  }, [fontSize, reducedMotion, savePreferences])

  const setReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotionState(enabled)
    applyReducedMotion(enabled)
    savePreferences({ fontSize, highContrast, reducedMotion: enabled })
  }, [fontSize, highContrast, savePreferences])

  const resetPreferences = useCallback(() => {
    setFontSizeState("normal")
    setHighContrastState(false)
    setReducedMotionState(false)
    applyFontSize("normal")
    applyHighContrast(false)
    applyReducedMotion(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value: AccessibilityContextType = {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    resetPreferences,
  }

  if (!mounted) {
    return (
      <AccessibilityContext.Provider value={{
        ...defaultPreferences,
        setFontSize: () => {},
        setHighContrast: () => {},
        setReducedMotion: () => {},
        resetPreferences: () => {},
      }}>
        {children}
      </AccessibilityContext.Provider>
    )
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}

export { type FontSize, type ContrastMode }
