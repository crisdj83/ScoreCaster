'use client'

import { useState } from 'react'
import { BadgeDollarSign, Gauge, SlidersHorizontal, UserRound, Check, Crosshair, X } from 'lucide-react'

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
  currentMatchday,
  gameweeks,
  fixtures,
  playersByMatch,
  selectedMatchId,
}: {
  currentMatchday: number | null
  gameweeks: number[]
  fixtures: Fixture[]
  playersByMatch: Record<string, Player[]>
  selectedMatchId?: string
}) {
  const [selectedMatchday, setSelectedMatchday] = useState(currentMatchday ?? gameweeks[0] ?? 1)
  const [focusedMatchId, setFocusedMatchId] = useState(selectedMatchId)
  const gameweekFixtures = fixtures.filter(fixture => fixture.matchday === selectedMatchday)
  const focusedIndex = gameweekFixtures.findIndex(fixture => fixture.id === focusedMatchId)
  const selectedFixtures = focusedIndex >= 0 ? [gameweekFixtures[focusedIndex]] : gameweekFixtures
  const selectedPlayers = focusedIndex >= 0 ? playersByMatch[gameweekFixtures[focusedIndex].id] || [] : []
  const selectedFixture = focusedIndex >= 0 ? gameweekFixtures[focusedIndex] : null
  const canReveal = selectedFixture
    ? Date.now() >= new Date(selectedFixture.kickoff).getTime() - 30 * 60 * 1000
    : false
  const showSelectedScore = canReveal && selectedFixture
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
    <section className="mb-8 rounded-2xl border border-orange-500/50 bg-[#242424] p-5 shadow-lg md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-300">Live gameweek</p>
          <h3 className="mt-1 text-xl font-black text-white">Scores and current points</h3>
          <p className="mt-1 text-sm text-gray-400">Live scores and points refresh every five minutes.</p>
        </div>
        <label className="flex items-center gap-3 text-sm font-bold text-gray-300">
          <span>Gameweek</span>
          <select
            value={selectedMatchday}
            onChange={event => {
              setSelectedMatchday(Number(event.target.value))
              setFocusedMatchId(undefined)
            }}
            className="rounded-lg border border-orange-500/60 bg-[#111] px-3 py-2 text-white"
          >
            {gameweeks.map(matchday => <option key={matchday} value={matchday}>{matchday}</option>)}
          </select>
        </label>
      </div>

      {focusedIndex >= 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => moveMatch(-1)}
            disabled={focusedIndex === 0}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-gray-300 disabled:opacity-40"
          >
            Previous match
          </button>
          <span className="text-xs font-bold text-gray-500">{focusedIndex + 1} / {gameweekFixtures.length}</span>
          <button
            type="button"
            onClick={() => moveMatch(1)}
            disabled={focusedIndex === gameweekFixtures.length - 1}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-gray-300 disabled:opacity-40"
          >
            Next match
          </button>
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {selectedFixtures.length ? selectedFixtures.map(fixture => (
          <div key={fixture.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#181818] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2 font-semibold text-white">
              {fixture.isLive && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" title="Live" />}
              {fixture.homeCrest && <img src={fixture.homeCrest} alt="" className="h-6 w-6 object-contain" />}
              <span className="truncate">{fixture.home}</span>
            </div>
            <div className="px-3 text-center">
              <div className="font-mono text-lg font-black text-orange-300">{showSelectedScore ? fixture.score || '0 : 0' : '— : —'}</div>
              <div className={`text-[10px] uppercase tracking-wider ${fixture.isLive ? 'font-black text-emerald-400' : 'text-gray-500'}`}>{fixture.isLive ? 'Live' : fixture.status === 'FINISHED' ? 'Final' : 'Score hidden'}</div>
            </div>
            <div className="flex min-w-0 items-center gap-2 text-right font-semibold text-white">
              <span className="truncate">{fixture.away}</span>
              {fixture.awayCrest && <img src={fixture.awayCrest} alt="" className="h-6 w-6 object-contain" />}
            </div>
          </div>
        )) : <p className="text-sm text-gray-400">No fixtures available for this gameweek.</p>}
      </div>

      {focusedIndex >= 0 && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="mt-4 grid grid-cols-[4rem_minmax(0,1fr)_7rem_5rem] items-center gap-2 px-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
            <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> Rank</span>
            <span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> User</span>
            <span className="flex items-center gap-1"><SlidersHorizontal className="h-3.5 w-3.5" /> Pick</span>
            <span className="flex items-center gap-1"><BadgeDollarSign className="h-3.5 w-3.5" /> Points</span>
          </div>
        </div>
      )}

      {focusedIndex >= 0 && <div className="mt-2 space-y-2">
          {canReveal && selectedPlayers.length ? selectedPlayers.map((player, index) => (
            <div key={player.id} className="grid grid-cols-[4rem_minmax(0,1fr)_7rem_5rem] items-center gap-2 rounded-lg bg-[#181818] px-3 py-2 text-sm">
              <span className="font-mono font-black text-orange-300">{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}</span>
              <div className="flex min-w-0 items-center gap-2">
                {player.avatar ? <img src={player.avatar} alt="" className="h-7 w-7 rounded-full object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-xs font-black text-orange-300"><UserRound className="h-4 w-4" /></span>}
                <span className="truncate font-semibold text-white">{player.name}</span>
              </div>
              <span className="justify-self-start rounded-md border border-white/15 px-2 py-1 font-mono font-bold text-gray-200">{player.prediction}</span>
              <span className={`flex items-center gap-1 justify-self-start rounded-md px-2 py-1 font-black ${
                player.outcome === 'exact'
                  ? 'bg-amber-400/15 text-amber-300'
                  : player.outcome === 'zero'
                    ? 'bg-red-400/15 text-red-300'
                    : 'bg-emerald-400/15 text-emerald-300'
              }`}>
                {player.outcome === 'exact' ? <Crosshair className="h-3.5 w-3.5" /> : player.outcome === 'zero' ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                {player.points === null ? '—' : `+${player.points}`}
              </span>
            </div>
          )) : <p className="text-sm text-gray-400">{canReveal ? 'No predictions submitted for this match yet.' : 'Predictions and points are hidden until 30 minutes before kickoff.'}</p>}
        </div>}
    </section>
  )
}
