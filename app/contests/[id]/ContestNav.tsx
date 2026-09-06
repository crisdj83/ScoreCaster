'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Target, BarChart2, BookOpen, Settings, CalendarDays, Ellipsis } from 'lucide-react'
import { useTranslations } from '../../components/LocaleProvider'
import { cn } from '@/lib/utils'
import { segmentActive, segmentInactive } from '@/lib/tab-styles'

export default function ContestNav({ contestId, isAdmin }: { contestId: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const t = useTranslations()
  const [moreOpen, setMoreOpen] = useState(false)

  const primary = [
    { href: `/contests/${contestId}/predictions`, label: t('Predictions'), icon: Target },
    { href: `/contests/${contestId}/ranking`, label: t('Ranking'), icon: BarChart2 },
  ]
  const moreLinks = [
    { href: `/contests/${contestId}/fixtures`, label: t('Fixtures'), icon: CalendarDays },
    { href: `/contests/${contestId}/rules`, label: t('Rules'), icon: BookOpen },
  ]
  const settingsHref = `/contests/${contestId}/edit`
  const moreActive = moreLinks.some((link) => pathname === link.href)

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  return (
    <div className="sticky top-[57px] z-20 rounded-2xl border border-white/10 bg-zinc-950/70 p-1.5 shadow-lg backdrop-blur-md">
      {/* Mobile: play + rank, everything else in More */}
      <div className="relative flex items-center gap-1 md:hidden">
        {primary.map(({ href, label, icon: Icon }) => {
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
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-label={t('More')}
          onClick={() => setMoreOpen((open) => !open)}
          className={cn(
            'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border py-1.5 text-[10px] font-bold uppercase tracking-wide outline-none transition-all duration-300 active:scale-95',
            moreActive || moreOpen ? segmentActive : segmentInactive
          )}
        >
          <Ellipsis className="h-5 w-5 shrink-0" />
          <span className="truncate">{t('More')}</span>
        </button>
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

        {moreOpen ? (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              className="fixed inset-0 z-20 cursor-default"
              onClick={() => setMoreOpen(false)}
            />
            <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {moreLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold',
                  pathname === href ? 'bg-white/10 text-orange-200' : 'text-zinc-200 hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
          </>
        ) : null}
      </div>

      {/* Desktop: full contest tabs */}
      <div className="hidden items-center gap-1 md:flex">
        {[...primary, ...moreLinks].map(
          ({ href, label, icon: Icon }) => {
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
          }
        )}
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
