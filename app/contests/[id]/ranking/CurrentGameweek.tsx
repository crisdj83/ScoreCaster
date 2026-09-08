'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { BadgeDollarSign, ChevronLeft, ChevronRight, Gauge, SlidersHorizontal, UserRound, Check, Crosshair, X } from 'lucide-react'
import { useTranslations } from '../../../components/LocaleProvider'
import { Button } from '@/components/ui/button'
import { isUnoptimizedAvatar } from '../../../../lib/soccer-avatar'

type Fixture = {
  id: string
  matchday: number
  home: string
  away: string
  homeCrest?: string
  awayCrest?: string
  kickoff: string
  status: string
  score: string | null
  isLive: boolean
  homeScorers?: string[]
  awayScorers?: string[]
}

type Player = {
  id: string
  name: string
  prediction: string
  points: number | null
  avatar?: string | null
  outcome: 'zero' | 'close' | 'exact' | 'result'
}

function Crest({ src, name }: { src?: string; name: string }) {
  if (!src) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[8px] font-bold text-zinc-400">
        {name.slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return (
    <Image src={src} alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />
  )
}

export default function CurrentGameweek({
  fixtures,
  playersByMatch,
  selectedMatchId,
}: {
  fixtures: Fixture[]
  playersByMatch: Record<string, Player[]>
  selectedMatchId?: string
}) {
  const selectedFixtureFromUrl = selectedMatchId
    ? fixtures.find((fixture) => fixture.id === selectedMatchId)
    : undefined
  const defaultFixture =
    selectedFixtureFromUrl ||
    [...fixtures]
      .filter((fixture) => fixture.status === 'FINISHED')
      .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())[0] ||
    fixtures[0]
  const [selectedMatchday] = useState(defaultFixture?.matchday ?? 1)
  const [focusedMatchId, setFocusedMatchId] = useState(defaultFixture?.id)
  const [now, setNow] = useState<number | null>(null)
  const t = useTranslations()

  useEffect(() => {
    setNow(Date.now())
  }, [])

  const gameweekFixtures = fixtures.filter((fixture) => fixture.matchday === selectedMatchday)
  const focusedIndex = gameweekFixtures.findIndex((fixture) => fixture.id === focusedMatchId)
  const selectedFixtures = focusedIndex >= 0 ? [gameweekFixtures[focusedIndex]] : gameweekFixtures
  const selectedPlayers =
    focusedIndex >= 0 ? playersByMatch[gameweekFixtures[focusedIndex].id] || [] : []
  const selectedFixture = focusedIndex >= 0 ? gameweekFixtures[focusedIndex] : null
  const canReveal = selectedFixture && now !== null
    ? now >= new Date(selectedFixture.kickoff).getTime() - 30 * 60 * 1000
    : false
  const showSelectedScore =
    canReveal && selectedFixture
      ? selectedFixture.isLive || selectedFixture.status === 'FINISHED'
      : false

  const moveMatch = (direction: -1 | 1) => {
    if (focusedIndex < 0) return
    const nextIndex = focusedIndex + direction
    if (nextIndex >= 0 && nextIndex < gameweekFixtures.length) {
      setFocusedMatchId(gameweekFixtures[nextIndex].id)
    }
  }

  return (
    <section className="mb-5 rounded-xl border border-orange-500/40 bg-zinc-900 p-3 shadow-lg sm:p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-black uppercase tracking-wider text-zinc-100 sm:text-base">
          GW {selectedMatchday} · Scores
        </h3>
        {focusedIndex >= 0 ? (
          <span className="shrink-0 text-[10px] font-bold tabular-nums text-zinc-500">
            {focusedIndex + 1} / {gameweekFixtures.length}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        {selectedFixtures.length ? (
          selectedFixtures.map((fixture) => {
            const homeScorers = showSelectedScore ? fixture.homeScorers || [] : []
            const awayScorers = showSelectedScore ? fixture.awayScorers || [] : []
            const showScorers = homeScorers.length > 0 || awayScorers.length > 0

            return (
              <div
                key={fixture.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-x-1 rounded-xl border border-zinc-800 bg-zinc-950 px-1 py-2 sm:gap-x-2 sm:px-3"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-auto shrink-0 gap-0.5 px-1.5 text-[8px] font-black uppercase tracking-wider ${showScorers ? 'row-span-2 self-center' : ''}`}
                  onClick={() => moveMatch(-1)}
                  disabled={focusedIndex <= 0}
                  aria-label={t('Previous')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('Previous')}
                </Button>

                <div className="flex min-w-0 items-center justify-end gap-1.5">
                  <span className="truncate text-right text-xs font-semibold text-zinc-100 sm:text-sm">
                    {fixture.home}
                  </span>
                  <Crest src={fixture.homeCrest} name={fixture.home} />
                </div>

                <div className="flex min-w-[4.5rem] shrink-0 items-center justify-center gap-0.5 whitespace-nowrap sm:min-w-[5.5rem]">
                  {fixture.isLive ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" title="Live" />
                  ) : null}
                  <span className="font-mono text-sm font-black tabular-nums text-xactscore-accent sm:text-lg">
                    {showSelectedScore ? fixture.score || '0 : 0' : '— : —'}
                  </span>
                  {!fixture.isLive && fixture.status === 'FINISHED' && showSelectedScore ? (
                    <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">FT</span>
                  ) : null}
                </div>

                <div className="flex min-w-0 items-center gap-1.5">
                  <Crest src={fixture.awayCrest} name={fixture.away} />
                  <span className="truncate text-xs font-semibold text-zinc-100 sm:text-sm">
                    {fixture.away}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-auto shrink-0 gap-0.5 px-1.5 text-[8px] font-black uppercase tracking-wider ${showScorers ? 'row-span-2 self-center' : ''}`}
                  onClick={() => moveMatch(1)}
                  disabled={focusedIndex < 0 || focusedIndex === gameweekFixtures.length - 1}
                  aria-label={t('Next')}
                >
                  {t('Next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {showScorers ? (
                  <>
                    <div className="col-start-2 min-w-0 space-y-0.5 pt-1 text-right text-[10px] leading-tight text-zinc-500">
                      {homeScorers.map((scorer) => (
                        <div key={scorer} className="truncate">
                          {scorer}
                        </div>
                      ))}
                    </div>
                    <div />
                    <div className="min-w-0 space-y-0.5 pt-1 text-[10px] leading-tight text-zinc-500">
                      {awayScorers.map((scorer) => (
                        <div key={scorer} className="truncate">
                          {scorer}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            )
          })
        ) : (
          <p className="text-sm text-zinc-400">No fixtures available for this gameweek.</p>
        )}
      </div>

      {focusedIndex >= 0 && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <div className="mb-2 hidden items-center gap-2 px-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 sm:grid sm:grid-cols-[4rem_minmax(0,1fr)_7rem_5rem]">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> Rank
            </span>
            <span className="flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" /> User
            </span>
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Pick
            </span>
            <span className="flex items-center gap-1">
              <BadgeDollarSign className="h-3.5 w-3.5" /> Points
            </span>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {canReveal && selectedPlayers.length ? (
              selectedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex min-h-10 items-center gap-2 rounded-lg bg-zinc-950 px-3 py-1.5 text-sm sm:grid sm:grid-cols-[4rem_minmax(0,1fr)_7rem_5rem] sm:gap-2"
                >
                  <span className="w-6 shrink-0 font-mono text-xs font-black text-xactscore-accent sm:w-auto sm:text-sm">
                    {index + 1}
                    {index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                    {player.avatar ? (
                      <Image
                        src={player.avatar}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 shrink-0 rounded-full object-cover sm:h-7 sm:w-7"
                        unoptimized={isUnoptimizedAvatar(player.avatar)}
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-black text-orange-300 sm:h-7 sm:w-7">
                        <UserRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    )}
                    <span className="truncate font-semibold text-zinc-100">{player.name}</span>
                  </div>
                  <span className="shrink-0 rounded-md border border-zinc-700 px-1.5 py-0.5 font-mono text-xs font-bold text-zinc-200 sm:justify-self-start sm:px-2 sm:py-1 sm:text-sm">
                    {player.prediction}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-black sm:justify-self-start sm:px-2 sm:py-1 ${
                      player.outcome === 'exact'
                        ? 'bg-amber-400/15 text-amber-300'
                        : player.outcome === 'zero'
                          ? 'bg-red-400/15 text-red-300'
                          : 'bg-emerald-400/15 text-emerald-300'
                    }`}
                  >
                    {player.outcome === 'exact' ? (
                      <Crosshair className="h-3.5 w-3.5" />
                    ) : player.outcome === 'zero' ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {player.points === null ? '—' : `+${player.points}`}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">
                {canReveal
                  ? 'No predictions submitted for this match yet.'
                  : 'Predictions and points are hidden until 30 minutes before kickoff.'}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
