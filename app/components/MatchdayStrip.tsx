'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'

export default function MatchdayStrip({
  matchdays,
  selected,
  onSelect,
}: {
  matchdays: number[]
  selected: number
  onSelect: (matchday: number) => void
}) {
  const t = useTranslations()
  const stripRef = useRef<HTMLDivElement>(null)
  const leftPadRef = useRef<HTMLDivElement>(null)
  const rightPadRef = useRef<HTMLDivElement>(null)
  const onSelectRef = useRef(onSelect)
  const [focused, setFocused] = useState(selected)
  const focusedRef = useRef(focused)
  const selectedRef = useRef(selected)
  onSelectRef.current = onSelect
  focusedRef.current = focused
  selectedRef.current = selected

  useEffect(() => {
    setFocused(selected)
  }, [selected])

  useEffect(() => {
    const strip = stripRef.current
    const leftPad = leftPadRef.current
    const rightPad = rightPadRef.current
    if (!strip || !leftPad || !rightPad) return

    const chips = () => strip.querySelectorAll<HTMLElement>('[data-matchday]')

    const updatePads = () => {
      const all = chips()
      const first = all[0]
      const last = all[all.length - 1]
      if (!first || !last) return
      leftPad.style.width = `${Math.max(0, strip.clientWidth / 2 - first.offsetWidth / 2)}px`
      rightPad.style.width = `${Math.max(0, strip.clientWidth / 2 - last.offsetWidth / 2)}px`
    }

    const chipAtCenter = () => {
      const stripRect = strip.getBoundingClientRect()
      const center = stripRect.left + stripRect.width / 2
      let bestValue = focusedRef.current
      let bestChip: HTMLElement | null = null
      let bestDist = Infinity
      chips().forEach((chip) => {
        const rect = chip.getBoundingClientRect()
        const dist = Math.abs(rect.left + rect.width / 2 - center)
        if (dist < bestDist) {
          bestDist = dist
          bestValue = Number(chip.dataset.matchday)
          bestChip = chip
        }
      })
      return { matchday: bestValue, chip: bestChip }
    }

    const scrollChipToCenter = (chip: HTMLElement, smooth: boolean) => {
      const stripRect = strip.getBoundingClientRect()
      const chipRect = chip.getBoundingClientRect()
      const delta =
        chipRect.left + chipRect.width / 2 - (stripRect.left + stripRect.width / 2)
      const max = Math.max(0, strip.scrollWidth - strip.clientWidth)
      strip.scrollTo({
        left: Math.min(max, Math.max(0, strip.scrollLeft + delta)),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }

    const showMatchday = (matchday: number) => {
      if (!Number.isFinite(matchday)) return
      focusedRef.current = matchday
      setFocused(matchday)
      if (matchday !== selectedRef.current) {
        onSelectRef.current(matchday)
      }
    }

    const centerFocused = (smooth: boolean) => {
      updatePads()
      const selectedChip = strip.querySelector<HTMLElement>(
        `[data-matchday="${CSS.escape(String(focusedRef.current))}"]`
      )
      if (selectedChip) scrollChipToCenter(selectedChip, smooth)
    }

    centerFocused(false)
    const frame = window.requestAnimationFrame(() => centerFocused(false))

    let pointerId: number | null = null
    let startX = 0
    let startLeft = 0
    let dragged = false
    let settleTimer = 0

    const onScroll = () => {
      const { matchday } = chipAtCenter()
      if (Number.isFinite(matchday) && matchday !== focusedRef.current) {
        focusedRef.current = matchday
        setFocused(matchday)
      }
      if (pointerId !== null) return
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        const settled = chipAtCenter()
        if (settled.chip) scrollChipToCenter(settled.chip, true)
        showMatchday(settled.matchday)
      }, 80)
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

      const { matchday, chip } = chipAtCenter()
      if (dragged) {
        if (chip) scrollChipToCenter(chip, true)
        showMatchday(matchday)
        return
      }

      const hit = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest('[data-matchday]') as HTMLElement | null
      if (hit) {
        scrollChipToCenter(hit, true)
        showMatchday(Number(hit.dataset.matchday))
      }
    }

    const resize = new ResizeObserver(() => centerFocused(false))
    resize.observe(strip)

    strip.addEventListener('scroll', onScroll, { passive: true })
    strip.addEventListener('pointerdown', onPointerDown)
    strip.addEventListener('pointermove', onPointerMove)
    strip.addEventListener('pointerup', onPointerUp)
    strip.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settleTimer)
      resize.disconnect()
      strip.removeEventListener('scroll', onScroll)
      strip.removeEventListener('pointerdown', onPointerDown)
      strip.removeEventListener('pointermove', onPointerMove)
      strip.removeEventListener('pointerup', onPointerUp)
      strip.removeEventListener('pointercancel', onPointerUp)
    }
  }, [matchdays.length, selected])

  return (
    <div className="mb-6 min-w-0 max-w-full">
      <div
        ref={stripRef}
        className="relative flex w-full min-w-0 cursor-grab touch-none items-center overflow-x-auto overscroll-x-contain rounded-2xl bg-slate-100 py-1.5 select-none active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:bg-white/[0.08]"
        style={{ WebkitOverflowScrolling: 'touch' }}
        role="listbox"
        aria-label={t('Matchday')}
      >
        <div ref={leftPadRef} aria-hidden className="h-px shrink-0" />
        {matchdays.map((matchday) => {
          const isSelected = matchday === focused
          return (
            <button
              key={matchday}
              type="button"
              role="option"
              aria-selected={isSelected}
              data-matchday={String(matchday)}
              aria-label={`${t('Matchday')} ${matchday}`}
              className={cn(
                'flex shrink-0 items-center justify-center whitespace-nowrap px-6 py-2 text-center',
                isSelected
                  ? 'rounded-xl bg-white font-bold text-slate-900 shadow-sm dark:border-white/35 dark:bg-white/[0.1] dark:text-zinc-100 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_0_0_1px_rgb(255_149_61/0.35)]'
                  : 'rounded-xl font-semibold text-slate-500 transition-colors hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {t('Matchday')} {matchday}
            </button>
          )
        })}
        <div ref={rightPadRef} aria-hidden className="h-px shrink-0" />
      </div>
    </div>
  )
}
