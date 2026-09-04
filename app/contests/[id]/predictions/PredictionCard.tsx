'use client'

import { useEffect, useState, useTransition } from 'react'
import { Plus, Minus, Clock, Eye, MapPin } from 'lucide-react'
import { savePrediction } from './actions'
import Link from 'next/link'
import { useLocale, useTranslations } from '../../../components/LocaleProvider'

export default function PredictionCard({ match, contestId, existingPrediction, revealedPredictions = [] }: any) {
  const [homeScore, setHomeScore] = useState(existingPrediction?.predicted_home_score ?? 0)
  const [awayScore, setAwayScore] = useState(existingPrediction?.predicted_away_score ?? 0)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [saveError, setSaveError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const t = useTranslations()
  const { locale } = useLocale()

  // Check if the match has already started (lock the inputs)
  const kickoffTime = new Date(match.utcDate)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const millisecondsUntilKickoff = kickoffTime.getTime() - now
  const isLocked = millisecondsUntilKickoff <= 60 * 60 * 1000
  const canReveal = millisecondsUntilKickoff <= 30 * 60 * 1000
  const isHurryUp = millisecondsUntilKickoff > 0 && millisecondsUntilKickoff <= 2 * 60 * 60 * 1000
  const countdown = millisecondsUntilKickoff <= 0
    ? t('Started')
    : `${Math.floor(millisecondsUntilKickoff / 86400000)}d ${String(Math.floor((millisecondsUntilKickoff % 86400000) / 3600000)).padStart(2, '0')}:${String(Math.floor((millisecondsUntilKickoff % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((millisecondsUntilKickoff % 60000) / 1000)).padStart(2, '0')}`
  const [showPredictions, setShowPredictions] = useState(false)
  const togglePredictions = () => setShowPredictions((visible) => !visible)

  // Format the date nicely
  const dateFormatted = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
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

    // Save to database in the background without freezing the UI
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

  return (
    <div className={`p-4 md:p-6 border rounded-xl flex flex-col transition-all ${isHurryUp ? 'bg-red-950/30 border-red-500/70' : isLocked ? 'bg-[#242424] border-gray-200' : 'bg-[#242424] border-gray-200 hover:border-scorecaster-green hover:shadow-md'}`}>
      
      {/* Top Bar: Date & Status */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-gray-100 text-sm">
        <div className="flex items-center text-gray-500 font-medium">
          <Clock className="h-4 w-4 mr-2" />
          {dateFormatted}
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-black tabular-nums ${isHurryUp ? 'bg-red-600 text-white' : 'bg-gray-950 text-orange-200'}`}>
          {isHurryUp && <span className="mr-2">{t('Hurry up!')}</span>}
          {countdown}
        </div>
        {isLocked ? (
          <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-xs">{t('LOCKED')}</span>
        ) : (
          <div className="h-6 flex items-center">
             {isPending ? (
               <span className="text-gray-400 text-xs italic animate-pulse">{t('Saving...')}</span>
             ) : saveError ? (
               <span className="text-red-600 text-xs font-bold">{saveError}</span>
             ) : saveStatus === 'saved' ? (
               <span className="text-scorecaster-green text-xs font-bold">✓ {t('Saved')}</span>
             ) : null}
          </div>
        )}
      </div>

      {/* Main Row: Teams and Score Stepper */}
      <div
        className="flex cursor-pointer flex-col rounded-xl p-1 transition-colors hover:bg-gray-50 md:flex-row items-center justify-between gap-6 md:gap-4"
        role="button"
        tabIndex={0}
        aria-expanded={showPredictions}
        aria-label={`View predictions for ${match.homeTeam.name} versus ${match.awayTeam.name}`}
        onClick={togglePredictions}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            togglePredictions()
          }
        }}
      >
        
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1 text-center w-full">
          <img src={match.homeTeam.crest} alt={match.homeTeam.name} className={`h-16 w-16 object-contain mb-3 ${isLocked ? 'opacity-50' : ''}`} />
          <span className="font-bold text-gray-800 text-lg">{match.homeTeam.shortName || match.homeTeam.name}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">{t('Home')}</span>
        </div>

        {/* Score Stepper */}
        <div className="flex items-center justify-center gap-4 bg-[#1b1b1b] p-3 rounded-2xl border border-gray-100">
          
          {/* Home Controls */}
          <div className="flex flex-col gap-2">
            <button type="button" disabled={isLocked || isPending} onClick={() => handleScoreChange('home', 1)} className="p-2 bg-[#2d2d2d] rounded-lg border border-gray-200 text-gray-200 hover:text-scorecaster-green hover:border-scorecaster-green disabled:opacity-50 transition-colors shadow-sm">
              <Plus className="h-5 w-5" />
            </button>
            <div className="w-12 h-14 bg-[#0d0d0d] border border-gray-200 rounded-lg flex items-center justify-center text-2xl font-black text-white shadow-inner">
              {homeScore}
            </div>
            <button type="button" disabled={isLocked || isPending} onClick={() => handleScoreChange('home', -1)} className="p-2 bg-[#2d2d2d] rounded-lg border border-gray-200 text-gray-200 hover:text-red-500 hover:border-red-500 disabled:opacity-50 transition-colors shadow-sm">
              <Minus className="h-5 w-5" />
            </button>
          </div>

          <span className="text-gray-300 font-black text-xl">:</span>

          {/* Away Controls */}
          <div className="flex flex-col gap-2">
            <button type="button" disabled={isLocked || isPending} onClick={() => handleScoreChange('away', 1)} className="p-2 bg-[#2d2d2d] rounded-lg border border-gray-200 text-gray-200 hover:text-scorecaster-green hover:border-scorecaster-green disabled:opacity-50 transition-colors shadow-sm">
              <Plus className="h-5 w-5" />
            </button>
            <div className="w-12 h-14 bg-[#0d0d0d] border border-gray-200 rounded-lg flex items-center justify-center text-2xl font-black text-white shadow-inner">
              {awayScore}
            </div>
            <button type="button" disabled={isLocked || isPending} onClick={() => handleScoreChange('away', -1)} className="p-2 bg-[#2d2d2d] rounded-lg border border-gray-200 text-gray-200 hover:text-red-500 hover:border-red-500 disabled:opacity-50 transition-colors shadow-sm">
              <Minus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1 text-center w-full">
          <img src={match.awayTeam.crest} alt={match.awayTeam.name} className={`h-16 w-16 object-contain mb-3 ${isLocked ? 'opacity-50' : ''}`} />
          <span className="font-bold text-gray-800 text-lg">{match.awayTeam.shortName || match.awayTeam.name}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">{t('Away')}</span>
        </div>
      </div>
      {match.venue && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400">
          <MapPin className="h-4 w-4 text-orange-400" />
          <span>{match.venue}</span>
        </div>
      )}
      <div className="mt-6 border-t border-gray-100 pt-4">
        <button type="button" onClick={togglePredictions} className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-black uppercase tracking-wider transition-colors ${canReveal ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-400'}`}>
          <span className="flex items-center gap-2"><Eye className={`h-4 w-4 ${canReveal ? 'text-[#d4ff00]' : 'text-gray-400'}`} /> {canReveal ? `${showPredictions ? t('Hide') : t('View')} ${t("everyone's predictions")}` : t('Predictions hidden until 30 minutes before kickoff')}</span>
          {canReveal && <span className="text-[#d4ff00]">{revealedPredictions.length}</span>}
        </button>
        {showPredictions && canReveal && (
          <div className="mt-3 space-y-2">
            {revealedPredictions.length ? revealedPredictions.map((prediction: any) => (
              <div key={`${prediction.user_id}-${prediction.match_id}`} className="flex items-center justify-between rounded-lg bg-[#2d2d2d] px-3 py-2 text-sm">
                <span className="font-semibold text-gray-800">{prediction.users?.username || prediction.users?.email?.split('@')[0] || 'Player'}</span>
                <span className="flex items-center gap-3 font-black text-white">
                  {prediction.predicted_home_score} : {prediction.predicted_away_score}
                  {match.status === 'FINISHED' && prediction.points_earned !== null && prediction.points_earned !== undefined && (
                    <span className="rounded-full bg-[#d4ff00] px-2 py-1 text-xs text-black">+{prediction.points_earned} pts</span>
                  )}
                </span>
              </div>
            )) : <p className="text-sm text-gray-500">{t('No predictions submitted yet.')}</p>}
          </div>
        )}
        <Link
          href={`/contests/${contestId}/predictions/${match.id}`}
          className="mt-5 flex items-center justify-center rounded-xl border border-gray-200 bg-[#2d2d2d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:border-orange-500 hover:text-orange-300"
        >
          {t('Open match page')}
        </Link>
      </div>
    </div>
  )
}