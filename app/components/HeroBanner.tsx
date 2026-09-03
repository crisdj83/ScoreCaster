'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const TEAMS = [
  { name: 'Arsenal', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
  { name: 'Aston Villa', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png' },
  { name: 'Bournemouth', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png' },
  { name: 'Brentford', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png' },
  { name: 'Brighton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png' },
  { name: 'Chelsea', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' },
  { name: 'Crystal Palace', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png' },
  { name: 'Everton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png' },
  { name: 'Fulham', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png' },
  { name: 'Ipswich Town', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/379.png' },
  { name: 'Leicester City', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png' },
  { name: 'Liverpool', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png' },
  { name: 'Manchester City', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png' },
  { name: 'Manchester United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' },
  { name: 'Newcastle United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png' },
  { name: 'Nottingham Forest', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png' },
  { name: 'Southampton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png' },
  { name: 'Tottenham Hotspur', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png' },
  { name: 'West Ham United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png' },
  { name: 'Wolverhampton Wanderers', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png' }
]

export type ScoreData = {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string; 
}

export type NextMatchData = {
  date: string;
  homeTeam: string;
  awayTeam: string;
}

export default function HeroBanner({ 
  nextMatch, 
  recentScores 
}: { 
  nextMatch: NextMatchData | null;
  recentScores: ScoreData[];
}) {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' })

  useEffect(() => {
    if (!nextMatch?.date) return;

    const countdownDate = new Date(nextMatch.date).getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = countdownDate - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' })
        return
      }

      setTimeLeft({
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0'),
        hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
        minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
        seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0')
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [nextMatch])

  const getTeamLogo = (teamName: string) => {
    const team = TEAMS.find(t => t.name === teamName)
    return team ? team.crest : ''
  }

  return (
    <div className="w-full relative overflow-hidden rounded-2xl shadow-2xl flex flex-col lg:flex-row bg-gray-950 border border-gray-800">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-marquee-y {
          animation: scroll-y 25s linear infinite;
        }
        .animate-marquee-y:hover {
          animation-play-state: paused;
        }
      `}} />

      {/* LEFT SIDE: Countdown & Next Match */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-purple-900 via-purple-800 to-orange-600 p-6 sm:p-10 flex flex-col justify-between text-white relative">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚽</span>
            <span className="font-extrabold tracking-widest text-xs uppercase text-orange-200">Upcoming Match</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight mb-2">
            Premier League
          </h2>
          <p className="text-purple-100 font-medium text-base sm:text-lg">
            {nextMatch ? `${nextMatch.homeTeam} vs ${nextMatch.awayTeam}` : 'Season Ended / No Fixtures'}
          </p>
        </div>

        {/* Timers Container - Fully responsive wrapping */}
        <div className="mt-8">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center mb-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-purple-200 mb-1">Days</span>
              <div className="border-2 border-white/80 p-2 w-12 sm:w-14 flex items-center justify-center text-xl sm:text-2xl font-black font-mono rounded bg-black/20">
                {timeLeft.days}
              </div>
            </div>
            <span className="text-xl font-black">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-purple-200 mb-1">Hours</span>
              <div className="border-2 border-white/80 p-2 w-12 sm:w-14 flex items-center justify-center text-xl sm:text-2xl font-black font-mono rounded bg-black/20">
                {timeLeft.hours}
              </div>
            </div>
            <span className="text-xl font-black">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-purple-200 mb-1">Mins</span>
              <div className="border-2 border-white/80 p-2 w-12 sm:w-14 flex items-center justify-center text-xl sm:text-2xl font-black font-mono rounded bg-black/20">
                {timeLeft.minutes}
              </div>
            </div>
            <span className="text-xl font-black">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-purple-200 mb-1">Secs</span>
              <div className="border-2 border-orange-400 p-2 w-12 sm:w-14 flex items-center justify-center text-xl sm:text-2xl font-black font-mono text-orange-400 rounded bg-black/20">
                {timeLeft.seconds}
              </div>
            </div>
          </div>

          <div>
            <Link 
              href="/contests" 
              className="inline-block bg-[#d4ff00] hover:bg-[#bce600] text-black font-black uppercase tracking-wider px-6 py-3 text-xs sm:text-sm transition-colors rounded shadow-md"
            >
              Make Predictions
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Scrolling Latest Scores Feed */}
      <div className="w-full lg:w-1/2 bg-gray-950 relative overflow-hidden flex flex-col h-[350px] lg:h-[420px]">
        <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-gray-950 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-gray-950 to-transparent z-10 pointer-events-none"></div>
        
        <div className="absolute top-4 right-6 z-20">
          <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-full shadow">
            Latest Scores
          </span>
        </div>

        {recentScores.length > 0 ? (
          <div className="animate-marquee-y flex flex-col w-full p-4 sm:p-6 gap-3">
            {[...recentScores, ...recentScores].map((match, idx) => (
              <div key={`${match.id}-${idx}`} className="bg-gray-900/90 border border-gray-800 rounded-xl p-3 sm:p-4 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded">
                    {match.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                      {getTeamLogo(match.homeTeam) && (
                        <img src={getTeamLogo(match.homeTeam)} alt={match.homeTeam} className="w-5 h-5 object-contain flex-shrink-0" />
                      )}
                      <span className="text-gray-200 font-semibold text-sm truncate">{match.homeTeam}</span>
                    </div>
                    <span className="text-lg font-bold text-white flex-shrink-0">{match.homeScore !== null ? match.homeScore : '-'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                      {getTeamLogo(match.awayTeam) && (
                        <img src={getTeamLogo(match.awayTeam)} alt={match.awayTeam} className="w-5 h-5 object-contain flex-shrink-0" />
                      )}
                      <span className="text-gray-200 font-semibold text-sm truncate">{match.awayTeam}</span>
                    </div>
                    <span className="text-lg font-bold text-white flex-shrink-0">{match.awayScore !== null ? match.awayScore : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No recent matches to display.
          </div>
        )}
      </div>

    </div>
  )
}