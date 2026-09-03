'use client'

import { useState, useTransition } from 'react'
import { Plus, Minus, Clock } from 'lucide-react'
import { savePrediction } from './actions'

export default function PredictionCard({ match, contestId, existingPrediction }: any) {
  const [homeScore, setHomeScore] = useState(existingPrediction?.predicted_home_score ?? 0)
  const [awayScore, setAwayScore] = useState(existingPrediction?.predicted_away_score ?? 0)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')

  // Check if the match has already started (lock the inputs)
  const kickoffTime = new Date(match.utcDate)
  const hasStarted = new Date() > kickoffTime

  // Format the date nicely
  const dateFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(kickoffTime)

  const handleScoreChange = (team: 'home' | 'away', change: number) => {
    if (hasStarted) return

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
    startTransition(async () => {
      await savePrediction(contestId, match.id, newHome, newAway)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000) // Clear the saved checkmark after 2 seconds
    })
  }

  return (
    <div className={`p-4 md:p-6 border rounded-xl flex flex-col transition-all ${hasStarted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-scorecaster-green hover:shadow-md'}`}>
      
      {/* Top Bar: Date & Status */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 text-sm">
        <div className="flex items-center text-gray-500 font-medium">
          <Clock className="h-4 w-4 mr-2" />
          {dateFormatted}
        </div>
        {hasStarted ? (
          <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-xs">LOCKED</span>
        ) : (
          <div className="h-6 flex items-center">
             {isPending ? (
               <span className="text-gray-400 text-xs italic animate-pulse">Saving...</span>
             ) : saveStatus === 'saved' ? (
               <span className="text-scorecaster-green text-xs font-bold">✓ Saved</span>
             ) : null}
          </div>
        )}
      </div>

      {/* Main Row: Teams and Score Stepper */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1 text-center w-full">
          <img src={match.homeTeam.crest} alt={match.homeTeam.name} className={`h-16 w-16 object-contain mb-3 ${hasStarted ? 'opacity-50' : ''}`} />
          <span className="font-bold text-gray-800 text-lg">{match.homeTeam.shortName || match.homeTeam.name}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Home</span>
        </div>

        {/* Score Stepper */}
        <div className="flex items-center justify-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
          
          {/* Home Controls */}
          <div className="flex flex-col gap-2">
            <button disabled={hasStarted} onClick={() => handleScoreChange('home', 1)} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-scorecaster-green hover:border-scorecaster-green disabled:opacity-50 transition-colors shadow-sm">
              <Plus className="h-5 w-5" />
            </button>
            <div className="w-12 h-14 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-2xl font-black text-gray-800 shadow-inner">
              {homeScore}
            </div>
            <button disabled={hasStarted} onClick={() => handleScoreChange('home', -1)} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-500 disabled:opacity-50 transition-colors shadow-sm">
              <Minus className="h-5 w-5" />
            </button>
          </div>

          <span className="text-gray-300 font-black text-xl">:</span>

          {/* Away Controls */}
          <div className="flex flex-col gap-2">
            <button disabled={hasStarted} onClick={() => handleScoreChange('away', 1)} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-scorecaster-green hover:border-scorecaster-green disabled:opacity-50 transition-colors shadow-sm">
              <Plus className="h-5 w-5" />
            </button>
            <div className="w-12 h-14 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-2xl font-black text-gray-800 shadow-inner">
              {awayScore}
            </div>
            <button disabled={hasStarted} onClick={() => handleScoreChange('away', -1)} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-500 disabled:opacity-50 transition-colors shadow-sm">
              <Minus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1 text-center w-full">
          <img src={match.awayTeam.crest} alt={match.awayTeam.name} className={`h-16 w-16 object-contain mb-3 ${hasStarted ? 'opacity-50' : ''}`} />
          <span className="font-bold text-gray-800 text-lg">{match.awayTeam.shortName || match.awayTeam.name}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Away</span>
        </div>

      </div>
    </div>
  )
}