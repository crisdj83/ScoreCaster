'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Minus, Clock, Eye, MapPin } from 'lucide-react'
import { savePrediction } from './actions'
import Link from 'next/link'
import { useLocale, useTranslations } from '../../../components/LocaleProvider'
import { cn } from '@/lib/utils'

const SCORE_MAX = 5

function clampScore(value: number) {
  return Math.min(SCORE_MAX, Math.max(0, value))
}

function TeamCrest({
  src,
  name,
  dimmed,
}: {
  src?: string
  name: string
  dimmed?: boolean
}) {
  if (!src) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[8px] font-bold text-zinc-400">
        {name.slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return (
    <Image
      src={src}
      alt={name}
      width={20}
      height={20}
      className={cn('h-5 w-5 shrink-0 object-contain', dimmed && 'opacity-50')}
    />
  )
}

export default function PredictionCard({ match, contestId, existingPrediction, revealedPredictions = [], venue }: any) {
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
      await savePrediction(contestId, match.id, home, away)
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
        void savePrediction(contestId, match.id, home, away)
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

  const stepperBtn =
    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-200 backdrop-blur-md transition-colors hover:border-orange-400/40 hover:bg-white/10 active:scale-90 disabled:opacity-40'
  const homeName = match.homeTeam.shortName || match.homeTeam.name
  const awayName = match.awayTeam.shortName || match.awayTeam.name
  const saveLabel = isPending
    ? t('Saving...')
    : saveError
      ? saveError
      : saveStatus === 'saved'
        ? `✓ ${t('Saved')}`
        : null

  return (
    <div
      className={cn(
        'prediction-fixture-content flex flex-col overflow-hidden rounded-[1.25rem] border p-1.5',
        isHurryUp && 'prediction-hurry border-red-400/35'
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1">
        <TeamName crest={match.homeTeam.crest} name={homeName} dimmed={isLocked} />
        <TeamSteppers
          name={homeName}
          score={homeScore}
          disabled={isLocked}
          onDec={() => handleScoreChange('home', -1)}
          onInc={() => handleScoreChange('home', 1)}
          canDec={homeScore > 0}
          canInc={homeScore < SCORE_MAX}
          stepperClass={stepperBtn}
        />
        <TeamName crest={match.awayTeam.crest} name={awayName} dimmed={isLocked} />
        <TeamSteppers
          name={awayName}
          score={awayScore}
          disabled={isLocked}
          onDec={() => handleScoreChange('away', -1)}
          onInc={() => handleScoreChange('away', 1)}
          canDec={awayScore > 0}
          canInc={awayScore < SCORE_MAX}
          stepperClass={stepperBtn}
        />
      </div>

      {canReveal ? (
        <Link
          href={`/contests/${contestId}/ranking?matchId=${match.id}`}
          className="mt-0.5 flex min-h-7 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2 text-[11px] font-bold text-zinc-100 transition-colors hover:bg-white/10"
        >
          <Eye className="h-3.5 w-3.5 shrink-0 text-xactscore-accent" />
          <span className="truncate">{t("View everyone's predictions")}</span>
          <span className="tabular-nums text-xactscore-accent">{revealedPredictions.length}</span>
        </Link>
      ) : null}

      <div className="mt-0.5 flex items-center gap-1.5 border-t border-white/[0.06] px-0.5 pt-1 text-[10px] font-semibold text-zinc-500">
        <Clock className="h-3 w-3 shrink-0" />
        <span className="min-w-0 truncate tabular-nums">{dateCompact}</span>
        {isHurryUp ? (
          <span className="shrink-0 rounded-full bg-red-500/20 px-1.5 py-px text-[9px] font-black uppercase tracking-wider text-red-300">
            {t('Hurry up!')}
          </span>
        ) : null}
        <span
          className={cn(
            'ml-auto shrink-0 tabular-nums',
            isEnded
              ? 'font-black text-zinc-400'
              : isInPlay || isHurryUp
                ? 'font-black text-red-300'
                : 'text-orange-300/90'
          )}
        >
          {countdown}
        </span>
        {isLocked && !isEnded && !isInPlay ? (
          <span className="shrink-0 rounded-full border border-red-400/30 bg-red-500/15 px-1.5 py-px text-[9px] font-black uppercase tracking-wider text-red-300">
            {t('LOCKED')}
          </span>
        ) : saveLabel ? (
          <span
            className={cn(
              'max-w-[7rem] truncate text-[10px]',
              saveError ? 'text-red-400' : isPending ? 'animate-pulse italic text-zinc-500' : 'text-xactscore-accent'
            )}
          >
            {saveLabel}
          </span>
        ) : null}
      </div>
      {venue ? (
        <p className="flex items-center gap-1 px-0.5 pb-0.5 text-[10px] font-semibold text-zinc-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{venue}</span>
        </p>
      ) : null}
    </div>
  )
}

function TeamName({
  crest,
  name,
  dimmed,
}: {
  crest?: string
  name: string
  dimmed?: boolean
}) {
  return (
    <div className="flex h-8 min-w-0 items-center gap-1.5 px-0.5">
      <TeamCrest src={crest} name={name} dimmed={dimmed} />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-tight text-zinc-100">
        {name}
      </span>
    </div>
  )
}

function TeamSteppers({
  name,
  score,
  disabled,
  onDec,
  onInc,
  canDec,
  canInc,
  stepperClass,
}: {
  name: string
  score: number
  disabled?: boolean
  onDec: () => void
  onInc: () => void
  canDec: boolean
  canInc: boolean
  stepperClass: string
}) {
  return (
    <div className="flex h-8 shrink-0 items-center">
      <button type="button" disabled={disabled || !canDec} onClick={onDec} className={stepperClass} aria-label={`Decrease ${name} score`}>
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-6 text-center text-base font-black tabular-nums text-white">{score}</span>
      <button type="button" disabled={disabled || !canInc} onClick={onInc} className={stepperClass} aria-label={`Increase ${name} score`}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}
