import Link from 'next/link'
import { ChevronRight, Trophy } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'

export type LeagueWeek = {
  contestId: string
  name: string
  openPicks: number
  rank: number | null
}

export default function HomeWeekList({
  locale,
  leagues,
}: {
  locale: Locale
  leagues: LeagueWeek[]
}) {
  const t = getTranslations(locale)
  const totalOpen = leagues.reduce((sum, league) => sum + league.openPicks, 0)

  if (leagues.length === 0) {
    return (
      <Link
        href="/contests"
        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition hover:shadow-md dark:border-xactscore-accent/40 dark:bg-xactscore-accent/10 dark:shadow-none dark:hover:bg-xactscore-accent/15"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-zinc-100">{t('Join a league')}</p>
          <p className="mt-1 text-sm text-zinc-400">{t('Create or join a league to start calling scores.')}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 dark:text-xactscore-accent" />
      </Link>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-orange-200">{t('Your week')}</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            {totalOpen > 0
              ? t('Put your scores in before they lock.')
              : t('You are up to date. Check the table or wait for the next matchday.')}
          </p>
        </div>
        {totalOpen > 0 ? (
          <span className="rounded-full bg-xactscore-accent px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-xactscore-bg">
            {totalOpen} {totalOpen === 1 ? t('pick left') : t('picks left')}
          </span>
        ) : null}
      </div>

      <ul className="space-y-2">
        {leagues.map((league) => (
          <li key={league.contestId}>
            <Link
              href={
                league.openPicks > 0
                  ? `/contests/${league.contestId}/predictions`
                  : `/contests/${league.contestId}/ranking`
              }
              className="mb-2.5 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 dark:mb-0 dark:border-white/10 dark:bg-white/[0.04] dark:p-3 dark:shadow-none dark:hover:border-white/20 dark:hover:bg-white/[0.07] dark:hover:shadow-none"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-100 text-slate-600 dark:border-transparent dark:bg-zinc-950 dark:text-xactscore-accent">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">{league.name}</p>
                <p className="text-xs text-zinc-500">
                  {league.openPicks > 0
                    ? `${league.openPicks} ${league.openPicks === 1 ? t('pick left') : t('picks left')}`
                    : t('All picks in')}
                  {league.rank ? ` · #${league.rank}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-xactscore-accent">
                {league.openPicks > 0 ? t('Put scores') : t('View table')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
