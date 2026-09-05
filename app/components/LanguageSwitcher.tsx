'use client'

import { Languages } from 'lucide-react'
import { locales, type Locale } from '../../lib/i18n'
import { useLocale, useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'
import { tabActive, tabBase } from '@/lib/tab-styles'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const t = useTranslations()

  return (
    <label className={cn(tabBase, tabActive, 'h-10 gap-1.5 px-2.5 sm:h-11 sm:px-3')}>
      <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t('Language')}</span>
      <select
        aria-label={t('Language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="cursor-pointer bg-transparent font-bold uppercase tracking-wider text-orange-100 outline-none"
      >
        {locales.map((item) => (
          <option key={item} value={item} className="bg-zinc-900 text-white">
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  )
}
