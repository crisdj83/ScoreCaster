'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { BadgeDollarSign, Gauge, SlidersHorizontal, UserRound, Check, Crosshair, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
}

type Player = {
  id: string
  name: string
  prediction: string
  points: number | null
  avatar?: string | null
  outcome: 'zero' | 'close' | 'exact' | 'result'
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
    <section className="mb-8 rounded-xl border border-orange-500/40 bg-zinc-900 p-4 shadow-lg sm:p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-300">Live gameweek</p>
          <h3 className="mt-1 text-xl font-black text-zinc-100">Scores and current points</h3>
          <p className="mt-1 text-sm text-zinc-400">Live scores and points refresh every five minutes.</p>
        </div>
      </div>

      {focusedIndex >= 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => moveMatch(-1)}
            disabled={focusedIndex === 0}
          >
            Previous match
          </Button>
          <span className="text-xs font-bold text-zinc-500">
            {focusedIndex + 1} / {gameweekFixtures.length}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => moveMatch(1)}
            disabled={focusedIndex === gameweekFixtures.length - 1}
          >
            Next match
          </Button>
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {selectedFixtures.length ? (
          selectedFixtures.map((fixture) => (
            <div
              key={fixture.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-2 font-semibold text-zinc-100">
                {fixture.isLive && (
                  <span
                    className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400"
                    title="Live"
                  />
                )}
                {fixture.homeCrest ? (
                  <Image src={fixture.homeCrest} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                ) : null}
                <span className="truncate">{fixture.home}</span>
              </div>
              <div className="px-3 text-center">
                <div className="font-mono text-lg font-black text-scorecaster-accent">
                  {showSelectedScore ? fixture.score || '0 : 0' : '— : —'}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-wider ${
                    fixture.isLive ? 'font-black text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  {fixture.isLive ? 'Live' : fixture.status === 'FINISHED' ? 'Final' : 'Score hidden'}
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2 font-semibold text-zinc-100 sm:justify-end sm:text-right">
                <span className="truncate">{fixture.away}</span>
                {fixture.awayCrest ? (
                  <Image src={fixture.awayCrest} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-400">No fixtures available for this gameweek.</p>
        )}
      </div>

      {focusedIndex >= 0 && (
        <div className="mt-6 border-t border-zinc-800 pt-5">
          {/* Desktop header */}
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
                  className="flex min-h-11 items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-sm sm:grid sm:grid-cols-[4rem_minmax(0,1fr)_7rem_5rem] sm:gap-2"
                >
                  <span className="w-6 shrink-0 font-mono text-xs font-black text-scorecaster-accent sm:w-auto sm:text-sm">
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
                        unoptimized={
                          player.avatar.includes('dicebear') || player.avatar.includes('supabase')
                        }
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
