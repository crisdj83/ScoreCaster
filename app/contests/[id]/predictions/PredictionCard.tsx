'use client'

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import Image from 'next/image'
import { Plus, Minus, Eye } from 'lucide-react'
import { savePrediction } from './actions'
import Link from 'next/link'
import { useLocale, useTranslations } from '../../../components/LocaleProvider'
import { cn } from '@/lib/utils'
import { FitTeamName } from '@/components/ui/fit-team-name'
import { teamDisplayName, teamTla } from '@/lib/team-tla'

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

function clampScore(value: number) {
  return Math.min(SCORE_MAX, Math.max(0, value))
}

function savedScore(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : value
}

function nextScore(current: number | null, change: number) {
  if (current === null) return change > 0 ? 1 : 0
  return clampScore(current + change)
}

export function KickoffGroupHeading({
  utcDate,
  aside,
}: {
  utcDate: string
  aside?: ReactNode
}) {
  const { locale } = useLocale()
  const kickoff = new Date(utcDate)
  const label = Number.isFinite(kickoff.getTime())
    ? new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(kickoff)
    : '—'

  const heading = (
    <h2 className="min-w-0 shrink-0 text-xs font-semibold tracking-tight text-slate-500 dark:text-[11px] dark:font-black dark:uppercase dark:tracking-widest dark:text-zinc-500">
      {label}
    </h2>
  )

  if (!aside) {
    return <div className="px-1">{heading}</div>
  }

  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {heading}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">{aside}</div>
    </div>
  )
}

function TeamCrest({ src, name, dimmed }: { src?: string; name: string; dimmed?: boolean }) {
  if (!src) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-zinc-700 shadow-[0_1px_8px_rgb(0_0_0/0.2)] sm:h-14 sm:w-14">
        {name.slice(0, 3).toUpperCase()}
      </span>
    )
  }
  return (
    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_8px_rgb(0_0_0/0.2)] sm:h-14 sm:w-14">
      <Image
        src={src}
        alt={name}
        width={40}
        height={40}
        className={cn('h-9 w-9 object-contain sm:h-10 sm:w-10', dimmed && 'opacity-50')}
      />
    </span>
  )
}

function ScoreStepper({
  label,
  score,
  readOnly,
  onDec,
  onInc,
  canDec,
  canInc,
}: {
  label: string
  score: number | null
  readOnly?: boolean
  onDec: () => void
  onInc: () => void
  canDec: boolean
  canInc: boolean
}) {
  if (readOnly) {
    return (
      <div className="flex h-10 shrink-0 items-center justify-center">
        <span className="text-2xl font-bold tabular-nums leading-none text-slate-900 dark:text-white">
          {score === null ? '—' : score}
        </span>
      </div>
    )
  }

  const btn =
    'prediction-stepper-btn inline-flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 active:scale-90 disabled:opacity-25 dark:border-white/15 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15'
  return (
    <div className="flex h-10 shrink-0 items-center justify-center gap-1">
      <button
        type="button"
        disabled={!canDec}
        onClick={onDec}
        className={btn}
        aria-label={`Decrease ${label} score`}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
      <span className="prediction-score-box flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold tabular-nums text-slate-900 shadow-sm dark:border-white/15 dark:bg-black/35 dark:text-white sm:h-10 sm:w-10">
        {score === null ? <span className="text-slate-400 dark:text-zinc-500">—</span> : score}
      </span>
      <button
        type="button"
        disabled={!canInc}
        onClick={onInc}
        className={btn}
        aria-label={`Increase ${label} score`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
    </div>
  )
}

export default function PredictionCard({
  match,
  contestId,
  existingPrediction,
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
}) {
  const initialHome = savedScore(existingPrediction?.predicted_home_score)
  const initialAway = savedScore(existingPrediction?.predicted_away_score)
  const [homeScore, setHomeScore] = useState<number | null>(initialHome)
  const [awayScore, setAwayScore] = useState<number | null>(initialAway)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [saveError, setSaveError] = useState('')
  const [now, setNow] = useState<number | null>(null)
  const t = useTranslations()
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
    const home = savedScore(existingPrediction?.predicted_home_score)
    const away = savedScore(existingPrediction?.predicted_away_score)
    homeScoreRef.current = home
    awayScoreRef.current = away
    lastSavedRef.current = { home, away }
    setHomeScore(home)
    setAwayScore(away)
  }, [existingPrediction?.predicted_home_score, existingPrediction?.predicted_away_score])

  const saveLatest = async () => {
    const home = homeScoreRef.current
    const away = awayScoreRef.current
    if (home === null || away === null) return
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
      if (
        home !== null &&
        away !== null &&
        (home !== lastSavedRef.current.home || away !== lastSavedRef.current.away)
      ) {
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

  const persistScores = (newHome: number | null, newAway: number | null) => {
    const home = newHome === null ? null : clampScore(newHome)
    const away = newAway === null ? null : clampScore(newAway)
    homeScoreRef.current = home
    awayScoreRef.current = away
    setHomeScore(home)
    setAwayScore(away)
    setSaveStatus('idle')
    setSaveError('')
    if (home === null || away === null) return
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
    const newHome = team === 'home' ? nextScore(currentHome, change) : currentHome
    const newAway = team === 'away' ? nextScore(currentAway, change) : currentAway
    if (newHome === currentHome && newAway === currentAway) return
    persistScores(newHome, newAway)
  }

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
  const isStatusBadge = Boolean(statusLabel) || (isLocked && !isEnded && !isInPlay)
  const urgencyClass = isStatusBadge
    ? 'rounded-md bg-slate-200/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-zinc-400'
    : cn(
        'text-[10px] font-semibold tabular-nums',
        saveError
          ? 'text-red-400'
          : isPending
            ? 'animate-pulse italic text-zinc-400'
            : isHurryUp
              ? 'font-black tabular-nums text-red-300'
              : 'text-xactscore-accent'
      )

  const hasPick = homeScore !== null && awayScore !== null

  return (
    <div
      className={cn(
        'prediction-fixture-content mb-2 touch-manipulation overflow-hidden rounded-2xl px-3 py-3 shadow-[0_4px_16px_rgb(0,0,0,0.03)] dark:mb-0 dark:shadow-none sm:mb-2.5 sm:px-4 sm:py-3.5',
        hasPick
          ? 'prediction-picked border border-emerald-100/90 bg-emerald-500/[0.04] dark:border-emerald-500/25 dark:bg-emerald-500/[0.08]'
          : 'prediction-unpicked border border-rose-100/80 bg-rose-500/[0.045] dark:border-rose-500/25 dark:bg-rose-500/[0.08]',
        isHurryUp && 'prediction-hurry border-red-400/35'
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] grid-rows-[1.25rem_auto] items-center gap-x-2 sm:gap-x-3">
        <div className="col-start-1 row-span-2 self-center">
          <TeamCrest src={match.homeTeam.crest} name={teamTla(match.homeTeam)} />
        </div>
        <FitTeamName
          name={match.homeTeam.name}
          shortName={match.homeTeam.shortName}
          tla={match.homeTeam.tla}
          className="col-start-2 row-start-1 min-w-0 text-center text-sm font-medium leading-5 text-slate-900 dark:font-bold dark:text-xactscore-text"
        />
        <div className="col-start-2 row-start-2 flex items-center justify-center">
          <ScoreStepper
            label={teamDisplayName(match.homeTeam)}
            score={homeScore}
            readOnly={isLocked}
            onDec={() => handleScoreChange('home', -1)}
            onInc={() => handleScoreChange('home', 1)}
            canDec={homeScore === null || homeScore > 0}
            canInc={homeScore === null || homeScore < SCORE_MAX}
          />
        </div>
        <span className="col-start-3 row-start-2 flex h-10 items-center justify-center px-1 text-base font-bold text-slate-400 sm:px-1.5">
          –
        </span>
        <FitTeamName
          name={match.awayTeam.name}
          shortName={match.awayTeam.shortName}
          tla={match.awayTeam.tla}
          className="col-start-4 row-start-1 min-w-0 text-center text-sm font-medium leading-5 text-slate-900 dark:font-bold dark:text-xactscore-text"
        />
        <div className="col-start-4 row-start-2 flex items-center justify-center">
          <ScoreStepper
            label={teamDisplayName(match.awayTeam)}
            score={awayScore}
            readOnly={isLocked}
            onDec={() => handleScoreChange('away', -1)}
            onInc={() => handleScoreChange('away', 1)}
            canDec={awayScore === null || awayScore > 0}
            canInc={awayScore === null || awayScore < SCORE_MAX}
          />
        </div>
        <div className="col-start-5 row-span-2 self-center">
          <TeamCrest src={match.awayTeam.crest} name={teamTla(match.awayTeam)} />
        </div>
      </div>

      <div className="relative mt-2 flex min-h-5 shrink-0 items-center justify-center">
        {canReveal ? (
          <Link
            href={`/contests/${contestId}/ranking?matchId=${match.id}`}
            className="inline-flex max-w-[calc(100%-5.5rem)] items-center gap-1 overflow-hidden whitespace-nowrap text-[10px] font-semibold leading-none text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
            aria-label={t("See everyone's prediction")}
          >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t("See everyone's prediction")}</span>
          </Link>
        ) : showUrgency ? (
          <span className={cn(urgencyClass, 'leading-none')}>{urgencyLabel}</span>
        ) : null}
        {canReveal && showUrgency ? (
          <span className={cn(urgencyClass, 'pointer-events-none absolute inset-y-0 right-0 flex items-center leading-none')}>
            {urgencyLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
