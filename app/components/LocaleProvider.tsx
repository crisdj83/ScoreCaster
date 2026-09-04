'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { defaultLocale, isLocale, type Locale, translate } from '../../lib/i18n'

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: defaultLocale,
  setLocale: () => {},
})

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale)
  const router = useRouter()

  useEffect(() => {
    const saved = window.localStorage.getItem('scorecaster_locale')
    if (isLocale(saved) && saved !== initialLocale) {
      document.cookie = `scorecaster_locale=${saved};path=/;max-age=31536000;samesite=lax`
      setLocaleState(saved)
      router.refresh()
    }
  }, [initialLocale, router])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem('scorecaster_locale', next)
    document.cookie = `scorecaster_locale=${next};path=/;max-age=31536000;samesite=lax`
    router.refresh()
  }

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useTranslations() {
  const { locale } = useLocale()
  return (key: string) => translate(locale, key)
}
