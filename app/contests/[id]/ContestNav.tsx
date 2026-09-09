'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Target, BarChart2, BookOpen, Settings, CalendarDays } from 'lucide-react'
import { useTranslations } from '../../components/LocaleProvider'
import { cn } from '@/lib/utils'
import { segmentActive, segmentInactive } from '@/lib/tab-styles'

export default function ContestNav({ contestId, isAdmin }: { contestId: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const t = useTranslations()

  const tabs = [
    { href: `/contests/${contestId}/predictions`, label: t('Predictions'), icon: Target },
    { href: `/contests/${contestId}/ranking`, label: t('Table'), icon: BarChart2 },
    { href: `/contests/${contestId}/fixtures`, label: t('Fixtures'), icon: CalendarDays },
  ]
  const rulesHref = `/contests/${contestId}/rules`
  const settingsHref = `/contests/${contestId}/edit`

  return (
    <div className="sticky top-[57px] z-20 rounded-[28px] border border-slate-200 bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-lg">
      <div className="flex items-center gap-1 md:hidden">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border py-1.5 text-[10px] font-bold uppercase tracking-wide outline-none transition-all duration-300 active:scale-95',
                active ? segmentActive : segmentInactive
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
        <Link
          href={rulesHref}
          aria-label={t('Rules')}
          title={t('Rules')}
          className={cn(
            'flex min-h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border outline-none transition-all duration-300 active:scale-95',
            pathname === rulesHref ? segmentActive : segmentInactive
          )}
        >
          <BookOpen className="h-5 w-5 shrink-0" />
        </Link>
        {isAdmin && (
          <Link
            href={settingsHref}
            aria-label={t('Settings')}
            title={t('Settings')}
            className={cn(
              'flex min-h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border outline-none transition-all duration-300 active:scale-95',
              pathname === settingsHref ? segmentActive : segmentInactive
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
          </Link>
        )}
      </div>

      <div className="hidden items-center gap-1 md:flex">
        {[...tabs, { href: rulesHref, label: t('Rules'), icon: BookOpen }].map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold uppercase tracking-wider outline-none transition-all duration-300 active:scale-95 md:px-4 md:text-sm',
                active ? segmentActive : segmentInactive
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href={settingsHref}
            className={cn(
              'flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider outline-none transition-all duration-300 active:scale-95 md:ml-auto md:text-sm',
              pathname === settingsHref ? segmentActive : segmentInactive
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>{t('Settings')}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
