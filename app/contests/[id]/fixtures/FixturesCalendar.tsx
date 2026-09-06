'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Clock, Calendar, Sparkles } from 'lucide-react'
import { useTranslations } from '../../../components/LocaleProvider'
import { ScoreBadge } from '@/components/ui/badge'

export type Match = {
  id: number | string
  matchday: number
  utcDate: string
  status: string
  homeTeam: { id?: number | string; name: string; shortName?: string; crest?: string }
  awayTeam: { id?: number | string; name: string; shortName?: string; crest?: string }
  score?: {
    fullTime?: { home?: number | null; away?: number | null }
  }
}

export default function FixturesCalendar({
  matches,
  contestId,
  locale,
}: {
  matches: Match[]
  contestId: string
  locale: string
}) {
  const t = useTranslations()

  const matchdays = useMemo(() => {
    const set = new Set<number>()
    matches.forEach((m) => {
      if (typeof m.matchday === 'number' && !isNaN(m.matchday)) {
        set.add(m.matchday)
      }
    })
    return Array.from(set).sort((a, b) => a - b)
  }, [matches])

  const currentMatchday = useMemo(() => {
    if (matchdays.length === 0) return 1

    const now = Date.now()
    const liveMatch = matches.find((m) => ['IN_PLAY', 'PAUSED'].includes(m.status))
    if (liveMatch) return Number(liveMatch.matchday)

    const upcomingMatch = matches
      .filter((m) => ['TIMED', 'SCHEDULED'].includes(m.status) && new Date(m.utcDate).getTime() > now)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0]
    if (upcomingMatch) return Number(upcomingMatch.matchday)

    const finishedMatches = matches
      .filter((m) => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    if (finishedMatches.length > 0) return Number(finishedMatches[0].matchday)

    return matchdays[0]
  }, [matches, matchdays])

  const [selectedMatchday, setSelectedMatchday] = useState<number>(currentMatchday)

  useEffect(() => {
    setSelectedMatchday(currentMatchday)
  }, [currentMatchday])

  const currentIndex = matchdays.indexOf(selectedMatchday)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex >= 0 && currentIndex < matchdays.length - 1

  const selectedFixtures = useMemo(() => {
    return matches.filter((m) => Number(m.matchday) === selectedMatchday)
  }, [matches, selectedMatchday])

  if (matchdays.length === 0) {
    return null
  }

  const isCurrentGameweekSelected = selectedMatchday === currentMatchday

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-1.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (canGoPrev) setSelectedMatchday(matchdays[currentIndex - 1])
            }}
            disabled={!canGoPrev}
            aria-label={t('Previous')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-all hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 sm:flex-row sm:justify-center sm:gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-xactscore-accent" />
              <h3 className="font-black uppercase tracking-wider text-zinc-100">
                {t('GW')} {selectedMatchday}
              </h3>
            </div>
            {isCurrentGameweekSelected ? (
              <span className="rounded-full border border-xactscore-accent/40 bg-xactscore-accent/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-orange-300">
                {t('Current Gameweek')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedMatchday(currentMatchday)}
                className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-300 transition-colors hover:bg-orange-500/20 active:scale-95"
              >
                <Sparkles className="h-3 w-3" />
                <span>
                  {t('GW')} {currentMatchday}
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (canGoNext) setSelectedMatchday(matchdays[currentIndex + 1])
            }}
            disabled={!canGoNext}
            aria-label={t('Next')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-all hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
        <div className="flex items-center justify-between bg-zinc-950 px-4 py-3 text-zinc-100 sm:px-5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
            {t('Matchday')} {selectedMatchday}
          </span>
          <span className="text-xs font-bold text-zinc-500">
            {selectedFixtures.length} {t('fixtures')}
          </span>
        </div>

        <div className="divide-y divide-zinc-800">
          {selectedFixtures.map((match) => {
            const score = match.score?.fullTime
            const hasScore =
              score?.home !== null &&
              score?.home !== undefined &&
              score?.away !== null &&
              score?.away !== undefined
            const homeName = match.homeTeam.shortName || match.homeTeam.name
            const awayName = match.awayTeam.shortName || match.awayTeam.name

            return (
              <Link
                key={match.id}
                href={`/contests/${contestId}/predictions/${match.id}`}
                className="fixture-calendar-game flex min-h-[72px] flex-col gap-3 px-4 py-4 transition-colors hover:bg-zinc-800/50 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4 sm:px-5"
              >
                <span className="flex items-center gap-2 font-bold text-zinc-100 sm:justify-end sm:text-right">
                  {match.homeTeam.crest ? (
                    <Image
                      src={match.homeTeam.crest}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain sm:order-2"
                    />
                  ) : null}
                  <span className="truncate sm:order-1">{homeName}</span>
                </span>

                <span className="flex min-w-24 flex-col items-center gap-1 self-center">
                  {hasScore ? (
                    <ScoreBadge className="font-mono text-base">
                      {score.home} : {score.away}
                    </ScoreBadge>
                  ) : (
                    <span className="text-sm font-black text-xactscore-accent">vs</span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {new Date(match.utcDate).toLocaleString(locale, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>

                <span className="flex items-center gap-2 font-bold text-zinc-100">
                  {match.awayTeam.crest ? (
                    <Image
                      src={match.awayTeam.crest}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain"
                    />
                  ) : null}
                  <span className="truncate">{awayName}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
