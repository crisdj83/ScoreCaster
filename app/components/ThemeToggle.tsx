'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <span
        className="inline-flex h-8 w-8 shrink-0 rounded-full border border-xactscore-border bg-xactscore-surface sm:h-11 sm:w-11"
        aria-hidden
      />
    )
  }

  const isDark = resolvedTheme !== 'light'

  return (
    <button
      type="button"
      aria-label={isDark ? t('Switch to light mode') : t('Switch to dark mode')}
      title={isDark ? t('Light mode') : t('Dark mode')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-xactscore-border bg-xactscore-surface text-xactscore-text shadow-sm outline-none transition-all duration-300 hover:border-slate-200 hover:bg-slate-100 active:scale-90 sm:h-11 sm:w-11 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10"
    >
      <Sun
        className={cn(
          'absolute h-3.5 w-3.5 text-amber-600 transition-all duration-300 sm:h-4 sm:w-4',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        )}
      />
      <Moon
        className={cn(
          'absolute h-3.5 w-3.5 text-orange-200 transition-all duration-300 sm:h-4 sm:w-4',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
      />
    </button>
  )
}
