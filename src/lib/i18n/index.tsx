import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { ptBR, type Translations } from "./locales/pt-BR"
import { en } from "./locales/en"

type Locale = "pt-BR" | "en"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const locales: Record<Locale, Translations> = {
  "pt-BR": ptBR,
  "en": en,
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const STORAGE_KEY = "tdb-locale"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-BR")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && locales[stored]) {
      setLocaleState(stored)
      document.documentElement.lang = stored
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
    document.documentElement.lang = newLocale
  }, [])

  const value: I18nContextType = {
    locale,
    setLocale,
    t: locales[locale],
  }

  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: "pt-BR", setLocale: () => {}, t: ptBR }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

export function useTranslation() {
  const { t } = useI18n()
  return { t }
}

export { type Locale, type Translations }
