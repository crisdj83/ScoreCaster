'use client'

import { Languages } from 'lucide-react'
import { localeNames, locales, type Locale } from '../../lib/i18n'
import { useLocale, useTranslations } from './LocaleProvider'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const t = useTranslations()

  return (
    <label className="flex items-center gap-2 rounded-full border border-orange-500/50 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-200 shadow-sm">
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t('Language')}</span>
      <select
        aria-label={t('Language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="cursor-pointer bg-transparent font-bold text-orange-100 outline-none"
      >
        {locales.map((item) => <option key={item} value={item} className="bg-gray-900 text-white">{localeNames[item]}</option>)}
      </select>
    </label>
  )
}
