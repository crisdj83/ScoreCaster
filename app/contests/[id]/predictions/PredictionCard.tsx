'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Minus, Clock, Eye, MapPin } from 'lucide-react'
import { savePrediction } from './actions'
import Link from 'next/link'
import { useLocale, useTranslations } from '../../../components/LocaleProvider'
import { Badge } from '@/components/ui/badge'
import { MatchCard } from '@/components/ui/match-row'

export default function PredictionCard({ match, contestId, existingPrediction, revealedPredictions = [] }: any) {
  const [homeScore, setHomeScore] = useState(existingPrediction?.predicted_home_score ?? 0)
  const [awayScore, setAwayScore] = useState(existingPrediction?.predicted_away_score ?? 0)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [saveError, setSaveError] = useState('')
  const [bounceDirection, setBounceDirection] = useState<'up' | 'down' | null>(null)
  const [now, setNow] = useState<number | null>(null)
  const t = useTranslations()
  const { locale } = useLocale()

  const kickoffTime = new Date(match.utcDate)
  useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const clock = now ?? kickoffTime.getTime()
  const millisecondsUntilKickoff = kickoffTime.getTime() - clock
  const isLocked = millisecondsUntilKickoff <= 60 * 60 * 1000
  const canReveal = millisecondsUntilKickoff <= 30 * 60 * 1000
  const isHurryUp = millisecondsUntilKickoff > 0 && millisecondsUntilKickoff <= 2 * 60 * 60 * 1000
  const countdown =
    now === null
      ? '…'
      : millisecondsUntilKickoff <= 0
        ? t('Started')
        : `${Math.floor(millisecondsUntilKickoff / 86400000)}d ${String(Math.floor((millisecondsUntilKickoff % 86400000) / 3600000)).padStart(2, '0')}:${String(Math.floor((millisecondsUntilKickoff % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((millisecondsUntilKickoff % 60000) / 1000)).padStart(2, '0')}`

  const dateFormatted = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(kickoffTime)

  const handleScoreChange = (team: 'home' | 'away', change: number) => {
    if (isLocked) return

    let newHome = homeScore
    let newAway = awayScore

    if (team === 'home') {
      newHome = Math.max(0, homeScore + change)
      setHomeScore(newHome)
    } else {
      newAway = Math.max(0, awayScore + change)
      setAwayScore(newAway)
    }
    setBounceDirection(change > 0 ? 'up' : 'down')
    window.setTimeout(() => setBounceDirection(null), 450)

    setSaveStatus('idle')
    setSaveError('')
    startTransition(async () => {
      try {
        await savePrediction(contestId, match.id, newHome, newAway)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Unable to save prediction.')
      }
    })
  }

  const stepperBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-200 transition-colors hover:border-scorecaster-accent hover:text-scorecaster-accent active:scale-90 disabled:opacity-50 sm:h-11 sm:w-11 sm:rounded-lg'

  return (
    <div
      className={`flex flex-col rounded-xl border p-4 transition-all md:p-6 ${
        isHurryUp
          ? 'border-red-500/70 bg-red-950/30'
          : 'border-zinc-800 bg-zinc-900 hover:border-scorecaster-accent/50'
      }`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4 text-sm">
        <div className="flex items-center font-medium text-zinc-400">
          <Clock className="mr-2 h-4 w-4" />
          {dateFormatted}
        </div>
        <Badge variant={isHurryUp ? 'danger' : 'accent'} className="rounded-full tabular-nums">
          {isHurryUp && <span className="mr-2">{t('Hurry up!')}</span>}
          {countdown}
        </Badge>
        {isLocked ? (
          <Badge variant="danger">{t('LOCKED')}</Badge>
        ) : (
          <div className="flex h-6 items-center">
            {isPending ? (
              <span className="animate-pulse text-xs italic text-zinc-500">{t('Saving...')}</span>
            ) : saveError ? (
              <span className="text-xs font-bold text-red-400">{saveError}</span>
            ) : saveStatus === 'saved' ? (
              <span className="text-xs font-bold text-scorecaster-accent">✓ {t('Saved')}</span>
            ) : null}
          </div>
        )}
      </div>

      <MatchCard className="flex flex-col items-stretch gap-3 sm:gap-6">
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-1 items-center justify-end gap-2 text-right">
              {match.homeTeam.crest ? (
                <Image
                  src={match.homeTeam.crest}
                  alt={match.homeTeam.name}
                  width={26}
                  height={26}
                  className={`h-[26px] w-[26px] shrink-0 object-contain ${isLocked ? 'opacity-50' : ''}`}
                />
              ) : null}
            </div>
            <span className="shrink-0 text-xs font-black uppercase tracking-wider text-zinc-600">vs</span>
            <div className="flex flex-1 items-center justify-start gap-2 text-left">
              {match.awayTeam.crest ? (
                <Image
                  src={match.awayTeam.crest}
                  alt={match.awayTeam.name}
                  width={26}
                  height={26}
                  className={`h-[26px] w-[26px] shrink-0 object-contain ${isLocked ? 'opacity-50' : ''}`}
                />
              ) : null}
            </div>
          </div>
          <div className="flex items-start justify-center gap-4 text-center">
            <span className="flex-1 truncate text-sm font-bold leading-tight text-zinc-100">
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
            <span className="w-4 shrink-0" />
            <span className="flex-1 truncate text-sm font-bold leading-tight text-zinc-100">
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
          </div>
        </div>

        <div className="hidden items-center justify-between gap-2 sm:flex">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {match.homeTeam.crest ? (
              <Image
                src={match.homeTeam.crest}
                alt={match.homeTeam.name}
                width={56}
                height={56}
                className={`h-14 w-14 object-contain ${isLocked ? 'opacity-50' : ''}`}
              />
            ) : null}
            <span className="text-lg font-bold text-zinc-100">
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t('Home')}
            </span>
          </div>

          <div className="relative flex shrink-0 items-center justify-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
            {bounceDirection && (
              <span
                className={`absolute -top-7 text-xl ${
                  bounceDirection === 'up' ? 'animate-bounce' : 'scorecaster-ball-down'
                }`}
                aria-hidden="true"
              >
                ⚽
              </span>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isLocked || isPending}
                onClick={() => handleScoreChange('home', 1)}
                className={stepperBtn}
                aria-label="Increase home score"
              >
                <Plus className="h-5 w-5" />
              </button>
              <div className="flex h-14 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-2xl font-black text-white shadow-inner">
                {homeScore}
              </div>
              <button
                type="button"
                disabled={isLocked || isPending}
                onClick={() => handleScoreChange('home', -1)}
                className={stepperBtn}
                aria-label="Decrease home score"
              >
                <Minus className="h-5 w-5" />
              </button>
            </div>

            <span className="text-xl font-black text-zinc-500">:</span>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isLocked || isPending}
                onClick={() => handleScoreChange('away', 1)}
                className={stepperBtn}
                aria-label="Increase away score"
              >
                <Plus className="h-5 w-5" />
              </button>
              <div className="flex h-14 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-2xl font-black text-white shadow-inner">
                {awayScore}
              </div>
              <button
                type="button"
                disabled={isLocked || isPending}
                onClick={() => handleScoreChange('away', -1)}
                className={stepperBtn}
                aria-label="Decrease away score"
              >
                <Minus className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {match.awayTeam.crest ? (
              <Image
                src={match.awayTeam.crest}
                alt={match.awayTeam.name}
                width={56}
                height={56}
                className={`h-14 w-14 object-contain ${isLocked ? 'opacity-50' : ''}`}
              />
            ) : null}
            <span className="text-lg font-bold text-zinc-100">
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t('Away')}
            </span>
          </div>
        </div>

        <div className="relative flex items-center justify-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 sm:hidden">
          {bounceDirection && (
            <span
              className={`absolute -top-6 text-base ${
                bounceDirection === 'up' ? 'animate-bounce' : 'scorecaster-ball-down'
              }`}
              aria-hidden="true"
            >
              ⚽
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isLocked || isPending}
              onClick={() => handleScoreChange('home', -1)}
              className={stepperBtn}
              aria-label="Decrease home score"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-xl font-black text-white">{homeScore}</span>
            <button
              type="button"
              disabled={isLocked || isPending}
              onClick={() => handleScoreChange('home', 1)}
              className={stepperBtn}
              aria-label="Increase home score"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-lg font-black text-zinc-600">:</span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isLocked || isPending}
              onClick={() => handleScoreChange('away', -1)}
              className={stepperBtn}
              aria-label="Decrease away score"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-xl font-black text-white">{awayScore}</span>
            <button
              type="button"
              disabled={isLocked || isPending}
              onClick={() => handleScoreChange('away', 1)}
              className={stepperBtn}
              aria-label="Increase away score"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </MatchCard>

      {match.venue && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400">
          <MapPin className="h-4 w-4 text-scorecaster-accent" />
          <span>{match.venue}</span>
        </div>
      )}

      <div className="mt-6 border-t border-zinc-800 pt-4">
        {canReveal ? (
          <Link
            href={`/contests/${contestId}/ranking?matchId=${match.id}`}
            className="flex min-h-11 w-full items-center justify-between rounded-xl bg-zinc-950 px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-100 transition-colors hover:bg-zinc-800"
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-scorecaster-accent" /> {t("View everyone's predictions")}
            </span>
            <span className="text-scorecaster-accent">{revealedPredictions.length}</span>
          </Link>
        ) : (
          <div className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-zinc-800/50 px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-zinc-500">
            <Eye className="h-4 w-4" /> {t('Predictions hidden until 30 minutes before kickoff')}
          </div>
        )}
      </div>
    </div>
  )
}
