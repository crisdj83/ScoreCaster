'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from './LocaleProvider'
import { AppleMark, PlayStoreMark } from './StoreMarks'
import { cn } from '@/lib/utils'

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
  const ios = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || ios
}

export default function InstallPwaBar() {
  const t = useTranslations()
  const pathname = usePathname()
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    setStandalone(isStandaloneDisplay())
  }, [])

  if (standalone || (pathname || '').startsWith('/help/install')) return null

  return (
    <div className="install-pwa-bar mt-2 flex gap-2 border-t border-slate-200/80 pt-2 dark:border-slate-800">
      <Link
        href="/help/install#ios"
        className={cn(
          'inline-flex min-h-11 flex-1 select-none items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm outline-none transition-all duration-200 touch-manipulation hover:shadow-md active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-zinc-100 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:shadow-none sm:text-xs'
        )}
      >
        <AppleMark className="h-4 w-4 shrink-0" />
        <span className="truncate">{t('Install on iPhone')}</span>
      </Link>
      <Link
        href="/help/install#android"
        className={cn(
          'inline-flex min-h-11 flex-1 select-none items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm outline-none transition-all duration-200 touch-manipulation hover:shadow-md active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-zinc-100 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:shadow-none sm:text-xs'
        )}
      >
        <PlayStoreMark className="h-4 w-4 shrink-0" />
        <span className="truncate">{t('Install on Android')}</span>
      </Link>
    </div>
  )
}
