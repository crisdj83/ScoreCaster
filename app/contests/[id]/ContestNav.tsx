'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, BarChart2, BookOpen, Shield, Settings, CalendarDays } from 'lucide-react'
import { useTranslations } from '../../components/LocaleProvider'
import { cn } from '@/lib/utils'
import { segmentActive, segmentBase, segmentInactive } from '@/lib/tab-styles'

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
    <div className="sticky top-[57px] z-20 -mx-1 overflow-x-auto hide-scrollbar rounded-xl border border-white/10 bg-zinc-950/70 p-1.5 shadow-lg backdrop-blur-md sm:mx-0">
      <div className="flex min-w-max gap-1">
        {links.map(({ href, label, short, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(segmentBase, active ? segmentActive : segmentInactive)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href={`/contests/${contestId}/edit`}
            className={cn(
              segmentBase,
              'ml-auto',
              pathname === `/contests/${contestId}/edit` ? segmentActive : segmentInactive
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Settings')}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
