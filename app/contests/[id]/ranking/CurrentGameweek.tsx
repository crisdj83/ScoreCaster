'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { BadgeDollarSign, Gauge, SlidersHorizontal, UserRound, Check, Crosshair, X } from 'lucide-react'
import { useTranslations } from '../../../components/LocaleProvider'
import { cn } from '@/lib/utils'
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
  liveMinute?: number | null
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

function Crest({
  src,
  name,
  size = 40,
}: {
  src?: string
  name: string
  size?: number
}) {
  const inner = Math.round(size * 0.68)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_8px_rgb(0_0_0/0.35)]"
      style={{ width: size, height: size }}
      title={name}
    >
      {src ? (
        <Image src={src} alt="" width={inner} height={inner} draggable={false} className="pointer-events-none object-contain" />
      ) : (
        <span className="px-0.5 text-center text-[9px] font-black leading-none text-zinc-700">
          {name.slice(0, 3).toUpperCase()}
        </span>
      )}
    </span>
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
  const stripRef = useRef<HTMLDivElement>(null)
  const focusedMatchIdRef = useRef(focusedMatchId)
  const t = useTranslations()
  focusedMatchIdRef.current = focusedMatchId

  const gameweekFixtures = fixtures.filter((fixture) => fixture.matchday === selectedMatchday)

  useEffect(() => {
    setNow(Date.now())
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return

    const chipAtCenter = () => {
      const center = strip.scrollLeft + strip.clientWidth / 2
      let bestId = ''
      let bestChip: HTMLElement | null = null
      let bestDist = Infinity
      strip.querySelectorAll<HTMLElement>('[data-fixture-id]').forEach((chip) => {
        const dist = Math.abs(chip.offsetLeft + chip.offsetWidth / 2 - center)
        if (dist < bestDist) {
          bestDist = dist
          bestId = chip.dataset.fixtureId || ''
          bestChip = chip
        }
      })
      return { id: bestId, chip: bestChip }
    }

    const scrollChipToCenter = (chip: HTMLElement, smooth: boolean) => {
      const left = chip.offsetLeft - strip.clientWidth / 2 + chip.offsetWidth / 2
      strip.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' })
    }

    const selectCentered = () => {
      const { id } = chipAtCenter()
      if (id && id !== focusedMatchIdRef.current) setFocusedMatchId(id)
    }

    const selected = strip.querySelector<HTMLElement>(
      `[data-fixture-id="${CSS.escape(focusedMatchIdRef.current || '')}"]`
    )
    if (selected) scrollChipToCenter(selected, false)

    let pointerId: number | null = null
    let startX = 0
    let startLeft = 0
    let dragged = false
    let settleTimer = 0

    const onScroll = () => {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(selectCentered, 80)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      dragged = false
      pointerId = event.pointerId
      startX = event.clientX
      startLeft = strip.scrollLeft
      strip.setPointerCapture(event.pointerId)
      strip.style.cursor = 'grabbing'
    }

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      const dx = event.clientX - startX
      if (Math.abs(dx) < 8 && !dragged) return
      dragged = true
      strip.scrollLeft = startLeft - dx
    }

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      pointerId = null
      strip.style.cursor = ''
      try {
        strip.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }

      if (dragged) {
        const { chip } = chipAtCenter()
        if (chip) scrollChipToCenter(chip, true)
        selectCentered()
        return
      }

      const hit = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest('[data-fixture-id]') as HTMLElement | null
      if (hit) {
        scrollChipToCenter(hit, true)
        const id = hit.dataset.fixtureId
        if (id) setFocusedMatchId(id)
      }
    }

    strip.addEventListener('scroll', onScroll, { passive: true })
    strip.addEventListener('pointerdown', onPointerDown)
    strip.addEventListener('pointermove', onPointerMove)
    strip.addEventListener('pointerup', onPointerUp)
    strip.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.clearTimeout(settleTimer)
      strip.removeEventListener('scroll', onScroll)
      strip.removeEventListener('pointerdown', onPointerDown)
      strip.removeEventListener('pointermove', onPointerMove)
      strip.removeEventListener('pointerup', onPointerUp)
      strip.removeEventListener('pointercancel', onPointerUp)
    }
  }, [selectedMatchday, gameweekFixtures.length])
  const focusedIndex = gameweekFixtures.findIndex((fixture) => fixture.id === focusedMatchId)
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
        {selectedFixture ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 sm:px-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-4">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <Crest src={selectedFixture.homeCrest} name={selectedFixture.home} size={44} />
                <p className="line-clamp-2 w-full text-center text-xs font-semibold leading-tight text-zinc-100 sm:text-sm">
                  {selectedFixture.home}
                </p>
                {showSelectedScore
                  ? (selectedFixture.homeScorers || []).map((scorer) => (
                      <p key={scorer} className="w-full truncate text-center text-[10px] leading-tight text-zinc-500">
                        {scorer}
                      </p>
                    ))
                  : null}
              </div>

              <div className="flex flex-col items-center pt-1">
                <div className="flex items-center gap-1.5">
                  {selectedFixture.isLive ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" title="Live" />
                  ) : null}
                  <span className="font-mono text-lg font-black tabular-nums text-xactscore-accent sm:text-xl">
                    {showSelectedScore ? selectedFixture.score || '0 : 0' : '— : —'}
                  </span>
                </div>
                {!selectedFixture.isLive && selectedFixture.status === 'FINISHED' && showSelectedScore ? (
                  <span className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-zinc-500">FT</span>
                ) : selectedFixture.isLive && typeof selectedFixture.liveMinute === 'number' ? (
                  <span className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    {`${selectedFixture.liveMinute}'`}
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <Crest src={selectedFixture.awayCrest} name={selectedFixture.away} size={44} />
                <p className="line-clamp-2 w-full text-center text-xs font-semibold leading-tight text-zinc-100 sm:text-sm">
                  {selectedFixture.away}
                </p>
                {showSelectedScore
                  ? (selectedFixture.awayScorers || []).map((scorer) => (
                      <p key={scorer} className="w-full truncate text-center text-[10px] leading-tight text-zinc-500">
                        {scorer}
                      </p>
                    ))
                  : null}
              </div>
            </div>

            {gameweekFixtures.length > 1 ? (
              <div className="relative mt-3 h-14">
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-12 w-[6.5rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/35 bg-white/[0.1] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_0_0_1px_rgb(255_149_61/0.35)]"
                  aria-hidden
                />
                <div
                  ref={stripRef}
                  className="hide-scrollbar relative z-10 flex h-14 cursor-grab touch-none items-center gap-2 overflow-x-auto overscroll-x-contain py-1 select-none active:cursor-grabbing [padding-inline:calc(50%-3.25rem)]"
                  role="listbox"
                  aria-label={t('Fixtures')}
                >
                  {gameweekFixtures.map((fixture) => {
                    const selected = fixture.id === focusedMatchId
                    return (
                      <button
                        key={fixture.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-fixture-id={fixture.id}
                        data-selected={selected ? 'true' : undefined}
                        title={`${fixture.home} vs ${fixture.away}`}
                        aria-label={`${fixture.home} vs ${fixture.away}`}
                        className={cn(
                          'flex h-12 w-[6.5rem] shrink-0 snap-center items-center justify-center gap-1 rounded-2xl bg-transparent transition-opacity',
                          selected ? 'opacity-100' : 'opacity-40'
                        )}
                      >
                        <Crest src={fixture.homeCrest} name={fixture.home} size={26} />
                        <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400">vs</span>
                        <Crest src={fixture.awayCrest} name={fixture.away} size={26} />
                      </button>
                    )
                  })}
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-zinc-950 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-zinc-950 to-transparent" />
              </div>
            ) : null}
          </div>
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
