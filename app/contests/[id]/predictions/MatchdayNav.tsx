'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from '../../../components/LocaleProvider'
import { cn } from '@/lib/utils'

export default function MatchdayNav({
  contestId,
  matchdays,
  selected,
  active,
}: {
  contestId: string
  matchdays: number[]
  selected: number
  active: number | null
}) {
  const t = useTranslations()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLAnchorElement>(null)
  const index = matchdays.indexOf(selected)
  const prev = index > 0 ? matchdays[index - 1] : null
  const next = index >= 0 && index < matchdays.length - 1 ? matchdays[index + 1] : null

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selected])

  const hrefFor = (matchday: number) =>
    matchday === active
      ? `/contests/${contestId}/predictions`
      : `/contests/${contestId}/predictions?md=${matchday}`

  const chevronClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 active:scale-95'

  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center gap-2">
        {prev ? (
          <Link href={hrefFor(prev)} className={chevronClass} aria-label={t('Previous')}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <span className={cn(chevronClass, 'pointer-events-none opacity-30')} aria-hidden>
            <ChevronLeft className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1 text-center">
          <h2 className="text-base font-bold text-zinc-100 sm:text-xl">
            {t('Matchday')} {selected}
          </h2>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {index + 1} / {matchdays.length}
            {active != null && selected !== active ? (
              <>
                {' · '}
                <Link href={hrefFor(active)} className="text-orange-300 hover:underline">
                  {t('GW')} {active}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        {next ? (
          <Link href={hrefFor(next)} className={chevronClass} aria-label={t('Next')}>
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <span className={cn(chevronClass, 'pointer-events-none opacity-30')} aria-hidden>
            <ChevronRight className="h-5 w-5" />
          </span>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {matchdays.map((matchday) => {
          const isSelected = matchday === selected
          const isActive = matchday === active
          return (
            <Link
              key={matchday}
              ref={isSelected ? selectedRef : undefined}
              href={hrefFor(matchday)}
              aria-current={isSelected ? 'page' : undefined}
              className={cn(
                'flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-2 text-[11px] font-black tabular-nums transition',
                isSelected
                  ? 'bg-xactscore-accent text-xactscore-bg'
                  : isActive
                    ? 'border border-orange-400/40 bg-orange-500/15 text-orange-200'
                    : 'border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
              )}
            >
              {matchday}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
