'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from './LocaleProvider'

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
  homeCrest?: string;
  awayCrest?: string;
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
  const t = useTranslations()

  useEffect(() => {
    if (!nextMatch?.date) return;

    const countdownDate = new Date(nextMatch.date).getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = countdownDate - now

      if (distance <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' })
        return
      }

      setTimeLeft({
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0'),
        hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
        minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
        seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0')
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [nextMatch])

  const getTeamLogo = (teamName: string) => {
    const team = TEAMS.find(t => t.name === teamName)
    return team ? team.crest : ''
  }

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-bl from-orange-600 via-zinc-900 to-zinc-950 shadow-2xl lg:flex-row">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-marquee-y {
          animation: scroll-y 36s linear infinite;
        }
        .animate-marquee-y:hover {
          animation-play-state: paused;
        }
        .hero-glass-veil {
          -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 48%, rgba(0,0,0,0.45) 72%, transparent 100%);
          mask-image: linear-gradient(to bottom, #000 0%, #000 48%, rgba(0,0,0,0.45) 72%, transparent 100%);
        }
        .scores-crossfade {
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0,0,0,0.18) 10%,
            rgba(0,0,0,0.55) 20%,
            #000 34%,
            #000 58%,
            rgba(0,0,0,0.7) 70%,
            rgba(0,0,0,0.35) 82%,
            rgba(0,0,0,0.1) 92%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0,0,0,0.18) 10%,
            rgba(0,0,0,0.55) 20%,
            #000 34%,
            #000 58%,
            rgba(0,0,0,0.7) 70%,
            rgba(0,0,0,0.35) 82%,
            rgba(0,0,0,0.1) 92%,
            transparent 100%
          );
        }
        @media (min-width: 1024px) {
          .hero-glass-veil {
            -webkit-mask-image: linear-gradient(to right, #000 0%, #000 46%, rgba(0,0,0,0.4) 72%, transparent 100%);
            mask-image: linear-gradient(to right, #000 0%, #000 46%, rgba(0,0,0,0.4) 72%, transparent 100%);
          }
          .scores-crossfade {
            -webkit-mask-image: linear-gradient(
              to right,
              transparent 0%,
              rgba(0,0,0,0.25) 8%,
              rgba(0,0,0,0.7) 18%,
              #000 32%,
              #000 100%
            ),
            linear-gradient(
              to bottom,
              #000 0%,
              #000 62%,
              rgba(0,0,0,0.45) 82%,
              transparent 100%
            );
            mask-image: linear-gradient(
              to right,
              transparent 0%,
              rgba(0,0,0,0.25) 8%,
              rgba(0,0,0,0.7) 18%,
              #000 32%,
              #000 100%
            ),
            linear-gradient(
              to bottom,
              #000 0%,
              #000 62%,
              rgba(0,0,0,0.45) 82%,
              transparent 100%
            );
            -webkit-mask-composite: source-in;
            mask-composite: intersect;
          }
        }
      `}} />

      {/* UPPER / LEFT: glass hero that melts into the scores */}
      <div className="relative z-10 w-full pb-8 text-white lg:w-1/2 lg:pb-0 lg:pr-6">
        <div
          aria-hidden
          className="hero-glass-veil pointer-events-none absolute inset-0 bg-white/[0.08] backdrop-blur-xl"
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-10">
        <div>
          <p className="mb-3 max-w-md text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
            {t('Call the scores.')}<br /><span className="text-xactscore-accent">{t('Own the table.')}</span>
          </p>
          <p className="mb-6 max-w-md text-sm leading-6 text-orange-100 sm:text-base">
            {t('Predict match outcomes, compete with your league, and climb the leaderboard every matchweek.')}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚽</span>
            <span className="font-extrabold tracking-widest text-xs uppercase text-orange-200">{t('Upcoming Match')}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight mb-2">
            Premier League
          </h2>
          <p className="text-orange-100 font-medium text-base sm:text-lg">
            {nextMatch ? `${nextMatch.homeTeam} vs ${nextMatch.awayTeam}` : t('Season Ended / No Fixtures')}
          </p>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center mb-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-orange-200 mb-1">{t('Days')}</span>
              <div className="border-2 border-white/80 p-2 w-12 sm:w-14 flex items-center justify-center text-xl sm:text-2xl font-black font-mono rounded bg-black/20">
                {timeLeft.days}
              </div>
            </div>
            <span className="text-xl font-black">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-orange-200 mb-1">{t('Hours')}</span>
              <div className="border-2 border-white/80 p-2 w-12 sm:w-14 flex items-center justify-center text-xl sm:text-2xl font-black font-mono rounded bg-black/20">
                {timeLeft.hours}
              </div>
            </div>
            <span className="text-xl font-black">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-orange-200 mb-1">{t('Mins')}</span>
              <div className="border-2 border-white/80 p-2 w-12 sm:w-14 flex items-center justify-center text-xl sm:text-2xl font-black font-mono rounded bg-black/20">
                {timeLeft.minutes}
              </div>
            </div>
            <span className="text-xl font-black">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-orange-200 mb-1">{t('Secs')}</span>
              <div className="border-2 border-orange-400 p-2 w-12 sm:w-14 flex items-center justify-center text-xl sm:text-2xl font-black font-mono text-orange-400 rounded bg-black/20">
                {timeLeft.seconds}
              </div>
            </div>
          </div>

          <div>
            <Link 
              href="/contests" 
              className="inline-block rounded bg-xactscore-accent px-6 py-3 text-xs font-black uppercase tracking-wider text-xactscore-bg shadow-md transition-colors hover:bg-[#ff922f] sm:text-sm"
            >
              {t('Make Predictions')}
            </Link>
          </div>
        </div>
        </div>
      </div>

      {/* LOWER / RIGHT: scores that rise out of the glass */}
      <div className="relative z-0 -mt-14 h-[340px] w-full overflow-hidden bg-transparent lg:mt-0 lg:-ml-10 lg:h-auto lg:min-h-[420px] lg:w-1/2">
        {recentScores.length > 0 ? (
          <div className="scores-crossfade absolute inset-0 overflow-hidden">
            <div className="animate-marquee-y flex min-h-full w-full flex-col gap-3 p-4 pt-16 sm:p-6 sm:pt-16 lg:pt-6">
            {[...recentScores, ...recentScores].map((match, idx) => (
              <div
                key={`${match.id}-${idx}`}
                className="rounded-xl border border-white/10 bg-white/[0.06] p-3 shadow-lg shadow-black/20 backdrop-blur-md transition-colors hover:border-orange-400/40 hover:bg-white/[0.1] sm:p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300 backdrop-blur-sm">
                    {match.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden sm:gap-3">
                      {(match.homeCrest || getTeamLogo(match.homeTeam)) && (
                        <img src={match.homeCrest || getTeamLogo(match.homeTeam)} alt={match.homeTeam} className="h-5 w-5 flex-shrink-0 object-contain" />
                      )}
                      <span className="truncate text-sm font-semibold text-zinc-100">{match.homeTeam}</span>
                    </div>
                    <span className="flex-shrink-0 text-lg font-bold text-white">{match.homeScore !== null ? match.homeScore : '-'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden sm:gap-3">
                      {(match.awayCrest || getTeamLogo(match.awayTeam)) && (
                        <img src={match.awayCrest || getTeamLogo(match.awayTeam)} alt={match.awayTeam} className="h-5 w-5 flex-shrink-0 object-contain" />
                      )}
                      <span className="truncate text-sm font-semibold text-zinc-100">{match.awayTeam}</span>
                    </div>
                    <span className="flex-shrink-0 text-lg font-bold text-white">{match.awayScore !== null ? match.awayScore : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
             </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
            {t('No recent matches to display.')}
          </div>
        )}
      </div>

    </div>
  )
}
