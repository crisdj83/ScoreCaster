'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Minus, Eye } from 'lucide-react'
import { savePrediction } from './actions'
import Link from 'next/link'
import { useLocale, useTranslations } from '../../../components/LocaleProvider'
import { cn } from '@/lib/utils'

const SCORE_MAX = 5

type MatchTeam = {
  name: string
  shortName?: string
  tla?: string
  crest?: string
}

type ExistingPrediction = {
  predicted_home_score?: number | null
  predicted_away_score?: number | null
}

type RevealedPrediction = {
  match_id?: number | string
}

function clampScore(value: number) {
  return Math.min(SCORE_MAX, Math.max(0, value))
}

function teamCode(team: MatchTeam) {
  if (team.tla) return team.tla
  const short = (team.shortName || team.name).replace(/[^A-Za-z]/g, '')
  return short.slice(0, 3).toUpperCase()
}

function TeamCrest({ src, name, dimmed }: { src?: string; name: string; dimmed?: boolean }) {
  if (!src) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-black text-zinc-700 shadow-[0_1px_6px_rgb(0_0_0/0.35)]">
        {name.slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgb(0_0_0/0.35)]">
      <Image
        src={src}
        alt={name}
        width={22}
        height={22}
        className={cn('h-[22px] w-[22px] object-contain', dimmed && 'opacity-50')}
      />
    </span>
  )
}

function ScoreStepper({
  label,
  score,
  disabled,
  onDec,
  onInc,
  canDec,
  canInc,
}: {
  label: string
  score: number
  disabled?: boolean
  onDec: () => void
  onInc: () => void
  canDec: boolean
  canInc: boolean
}) {
  const btn =
    'inline-flex h-5 w-7 items-center justify-center rounded-md transition active:scale-90 disabled:opacity-25'
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        disabled={disabled || !canInc}
        onClick={onInc}
        className={cn(btn, 'text-emerald-400 hover:bg-emerald-500/15')}
        aria-label={`Increase ${label} score`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-black/35 text-lg font-black tabular-nums text-white">
        {score}
      </span>
      <button
        type="button"
        disabled={disabled || !canDec}
        onClick={onDec}
        className={cn(btn, 'text-rose-400 hover:bg-rose-500/15')}
        aria-label={`Decrease ${label} score`}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
    </div>
  )
}

export default function PredictionCard({
  match,
  contestId,
  existingPrediction,
  revealedPredictions = [],
  venue,
}: {
  match: {
    id: number | string
    utcDate: string
    status?: string
    homeTeam: MatchTeam
    awayTeam: MatchTeam
  }
  contestId: string
  existingPrediction?: ExistingPrediction | null
  revealedPredictions?: RevealedPrediction[]
  venue?: string
}) {
  const initialHome = existingPrediction?.predicted_home_score ?? 0
  const initialAway = existingPrediction?.predicted_away_score ?? 0
  const [homeScore, setHomeScore] = useState(initialHome)
  const [awayScore, setAwayScore] = useState(initialAway)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [saveError, setSaveError] = useState('')
  const [now, setNow] = useState<number | null>(null)
  const t = useTranslations()
  const { locale } = useLocale()
  const homeScoreRef = useRef(initialHome)
  const awayScoreRef = useRef(initialAway)
  const lastSavedRef = useRef({ home: initialHome, away: initialAway })
  const saveTimerRef = useRef<number | null>(null)

  const kickoffTime = new Date(match.utcDate)
  useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (saveTimerRef.current) return
    const home = existingPrediction?.predicted_home_score ?? 0
    const away = existingPrediction?.predicted_away_score ?? 0
    homeScoreRef.current = home
    awayScoreRef.current = away
    lastSavedRef.current = { home, away }
    setHomeScore(home)
    setAwayScore(away)
  }, [existingPrediction?.predicted_home_score, existingPrediction?.predicted_away_score])

  const saveLatest = async () => {
    const home = homeScoreRef.current
    const away = awayScoreRef.current
    if (home === lastSavedRef.current.home && away === lastSavedRef.current.away) return
    try {
      await savePrediction(contestId, String(match.id), home, away)
      lastSavedRef.current = { home, away }
      if (homeScoreRef.current !== home || awayScoreRef.current !== away) {
        await saveLatest()
        return
      }
      setSaveStatus('saved')
      setSaveError('')
      window.setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save prediction.')
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      const home = homeScoreRef.current
      const away = awayScoreRef.current
      if (home !== lastSavedRef.current.home || away !== lastSavedRef.current.away) {
        void savePrediction(contestId, String(match.id), home, away)
      }
    }
  }, [contestId, match.id])

  const clock = now ?? Date.now()
  const millisecondsUntilKickoff = kickoffTime.getTime() - clock
  const matchStatus = String(match.status || '')
  const isInPlay = ['IN_PLAY', 'PAUSED'].includes(matchStatus)
  const isEnded =
    matchStatus === 'FINISHED' ||
    matchStatus === 'AWARDED' ||
    (now !== null && !isInPlay && millisecondsUntilKickoff <= -3 * 60 * 60 * 1000)
  const isLocked = millisecondsUntilKickoff <= 60 * 60 * 1000 || isInPlay || isEnded
  const canReveal = millisecondsUntilKickoff <= 30 * 60 * 1000 || isInPlay || isEnded
  const isHurryUp =
    millisecondsUntilKickoff > 0 && millisecondsUntilKickoff <= 2 * 60 * 60 * 1000 && !isEnded && !isInPlay
  const statusLabel = isEnded
    ? t('Ended')
    : isInPlay || (now !== null && millisecondsUntilKickoff <= 0)
      ? t('Started')
      : null
  const countdown = statusLabel
    ? statusLabel
    : now === null
      ? '…'
      : `${Math.floor(millisecondsUntilKickoff / 86400000)}d ${String(Math.floor((millisecondsUntilKickoff % 86400000) / 3600000)).padStart(2, '0')}:${String(Math.floor((millisecondsUntilKickoff % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((millisecondsUntilKickoff % 60000) / 1000)).padStart(2, '0')}`

  const dateCompact = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(kickoffTime)

  const persistScores = (newHome: number, newAway: number) => {
    const home = clampScore(newHome)
    const away = clampScore(newAway)
    homeScoreRef.current = home
    awayScoreRef.current = away
    setHomeScore(home)
    setAwayScore(away)
    setSaveStatus('idle')
    setSaveError('')
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null
      startTransition(() => {
        void saveLatest()
      })
    }, 1000)
  }

  const handleScoreChange = (team: 'home' | 'away', change: number) => {
    if (isLocked) return
    const currentHome = homeScoreRef.current
    const currentAway = awayScoreRef.current
    const newHome = team === 'home' ? clampScore(currentHome + change) : currentHome
    const newAway = team === 'away' ? clampScore(currentAway + change) : currentAway
    if (newHome === currentHome && newAway === currentAway) return
    persistScores(newHome, newAway)
  }

  const homeName = match.homeTeam.shortName || match.homeTeam.name
  const awayName = match.awayTeam.shortName || match.awayTeam.name
  const saveLabel = isPending
    ? t('Saving...')
    : saveError
      ? saveError
      : saveStatus === 'saved'
        ? `✓ ${t('Saved')}`
        : null
  const urgencyLabel = statusLabel
    ? statusLabel
    : isLocked && !isEnded && !isInPlay
      ? t('LOCKED')
      : isHurryUp
        ? countdown
        : saveLabel
  const showUrgency = Boolean(urgencyLabel)

  return (
    <div
      className={cn(
        'prediction-fixture-content overflow-hidden rounded-2xl border px-2.5 py-2',
        isHurryUp && 'prediction-hurry border-red-400/35'
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <TeamBlock team={match.homeTeam} displayName={homeName} dimmed={isLocked} align="end" />

        <div className="flex items-center justify-center gap-1">
          <ScoreStepper
            label={homeName}
            score={homeScore}
            disabled={isLocked}
            onDec={() => handleScoreChange('home', -1)}
            onInc={() => handleScoreChange('home', 1)}
            canDec={homeScore > 0}
            canInc={homeScore < SCORE_MAX}
          />
          <span className="pb-px text-sm font-black text-zinc-500">–</span>
          <ScoreStepper
            label={awayName}
            score={awayScore}
            disabled={isLocked}
            onDec={() => handleScoreChange('away', -1)}
            onInc={() => handleScoreChange('away', 1)}
            canDec={awayScore > 0}
            canInc={awayScore < SCORE_MAX}
          />
        </div>

        <TeamBlock team={match.awayTeam} displayName={awayName} dimmed={isLocked} align="start" />
      </div>

      <div className="relative mt-1 min-h-[1.15rem] px-8">
        <p className="truncate text-center text-[10px] font-semibold leading-tight text-zinc-400">
          <span className="tabular-nums">{dateCompact}</span>
          {venue ? (
            <>
              <span className="px-1 text-zinc-600">·</span>
              <span>{venue}</span>
            </>
          ) : null}
        </p>
        <span className="absolute inset-y-0 right-0 flex items-center gap-1.5 text-[10px] font-semibold">
          {showUrgency ? (
            <span
              className={cn(
                'max-w-[6.5rem] truncate tabular-nums',
                saveError
                  ? 'text-red-400'
                  : isPending
                    ? 'animate-pulse italic text-zinc-400'
                    : isEnded
                      ? 'text-zinc-400'
                      : isHurryUp
                        ? 'font-black tabular-nums text-red-300'
                        : isInPlay || (isLocked && !isEnded)
                          ? 'font-black uppercase tracking-wider text-red-300'
                          : 'text-xactscore-accent'
              )}
            >
              {urgencyLabel}
            </span>
          ) : null}
          {canReveal ? (
            <Link
              href={`/contests/${contestId}/ranking?matchId=${match.id}`}
              className="inline-flex items-center gap-0.5 text-zinc-400 transition hover:text-xactscore-accent"
              aria-label={t("View everyone's predictions")}
            >
              <Eye className="h-3 w-3" />
              <span className="tabular-nums">{revealedPredictions.length}</span>
            </Link>
          ) : null}
        </span>
      </div>
    </div>
  )
}

function TeamBlock({
  team,
  displayName,
  dimmed,
  align,
}: {
  team: MatchTeam
  displayName: string
  dimmed?: boolean
  align: 'start' | 'end'
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center gap-1',
        align === 'end' ? 'sm:flex-row sm:justify-end' : 'sm:flex-row-reverse sm:justify-end',
        'sm:gap-2'
      )}
    >
      <TeamCrest src={team.crest} name={displayName} dimmed={dimmed} />
      <span
        className={cn(
          'max-w-full truncate text-center text-[11px] font-black uppercase tracking-wide text-zinc-100',
          align === 'end' ? 'sm:text-right' : 'sm:text-left',
          dimmed && 'opacity-60'
        )}
        title={team.name}
      >
        <span className="sm:hidden">{teamCode(team)}</span>
        <span className="hidden sm:inline">{displayName}</span>
      </span>
    </div>
  )
}
