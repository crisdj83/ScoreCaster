'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, BarChart2, BookOpen, Shield, Settings, CalendarDays } from 'lucide-react'
import { useTranslations } from '../../components/LocaleProvider'
import { cn } from '@/lib/utils'
import { segmentActive, segmentInactive } from '@/lib/tab-styles'

export default function ContestNav({ contestId, isAdmin }: { contestId: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const t = useTranslations()
  const links = [
    { href: `/contests/${contestId}/predictions`, label: t('Predictions'), short: 'Tips', icon: Trophy },
    { href: `/contests/${contestId}/fixtures`, label: t('Fixtures'), short: 'Fix', icon: CalendarDays },
    { href: `/contests/${contestId}/ranking`, label: t('Ranking'), short: 'Rank', icon: BarChart2 },
    { href: `/contests/${contestId}/championship`, label: t('PL Standings'), short: 'PL', icon: Shield },
    { href: `/contests/${contestId}/rules`, label: t('Rules'), short: 'Rules', icon: BookOpen },
  ]

  return (
    <div className="sticky top-[57px] z-20 rounded-2xl border border-white/10 bg-zinc-950/70 p-1.5 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-1">
        {links.map(({ href, label, short, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border py-2 text-[9px] font-bold uppercase tracking-wide outline-none transition-all duration-300 active:scale-95 focus-visible:outline-none sm:flex-row sm:gap-2 sm:py-2.5 sm:text-xs sm:tracking-wider md:px-4 md:text-sm',
                active ? segmentActive : segmentInactive
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0 sm:h-4 sm:w-4" />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href={`/contests/${contestId}/edit`}
            className={cn(
              'flex min-h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2 text-[9px] font-bold uppercase tracking-wide outline-none transition-all duration-300 active:scale-95 focus-visible:outline-none sm:ml-auto sm:flex-row sm:gap-2 sm:py-2.5 sm:text-xs sm:tracking-wider md:px-4 md:text-sm',
              pathname === `/contests/${contestId}/edit` ? segmentActive : segmentInactive
            )}
          >
            <Settings className="h-[18px] w-[18px] shrink-0 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('Settings')}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
