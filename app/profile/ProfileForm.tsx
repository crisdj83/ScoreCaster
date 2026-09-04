'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Quote, Trophy, ChevronDown, Check } from 'lucide-react'
import { updateProfile } from './actions'
import { useTranslations } from '../components/LocaleProvider'

const PREMIER_LEAGUE_TEAMS = [
  { name: "Arsenal", logo: "https://crests.football-data.org/57.png" },
  { name: "Aston Villa", logo: "https://crests.football-data.org/58.png" },
  { name: "Bournemouth", logo: "https://crests.football-data.org/1044.png" },
  { name: "Brentford", logo: "https://crests.football-data.org/402.png" },
  { name: "Brighton", logo: "https://crests.football-data.org/397.png" },
  { name: "Chelsea", logo: "https://crests.football-data.org/61.png" },
  { name: "Crystal Palace", logo: "https://crests.football-data.org/354.png" },
  { name: "Everton", logo: "https://crests.football-data.org/62.png" },
  { name: "Fulham", logo: "https://crests.football-data.org/63.png" },
  { name: "Ipswich Town", logo: "https://crests.football-data.org/349.png" },
  { name: "Leicester City", logo: "https://crests.football-data.org/338.png" },
  { name: "Liverpool", logo: "https://crests.football-data.org/64.png" },
  { name: "Manchester City", logo: "https://crests.football-data.org/65.png" },
  { name: "Manchester United", logo: "https://crests.football-data.org/66.png" },
  { name: "Newcastle United", logo: "https://crests.football-data.org/67.png" },
  { name: "Nottingham Forest", logo: "https://crests.football-data.org/351.png" },
  { name: "Southampton", logo: "https://crests.football-data.org/340.png" },
  { name: "Tottenham Hotspur", logo: "https://crests.football-data.org/73.png" },
  { name: "West Ham United", logo: "https://crests.football-data.org/563.png" },
  { name: "Wolverhampton Wanderers", logo: "https://crests.football-data.org/76.png" }
]

export default function ProfileForm({ user, profile, messages }: any) {
  const [teamOpen, setTeamOpen] = useState(false)
  const t = useTranslations()
  const [selectedTeam, setSelectedTeam] = useState(PREMIER_LEAGUE_TEAMS.find(t => t.name === profile?.favorite_team) || null)
  const [motto, setMotto] = useState((profile?.quote || '').slice(0, 18))
  
  // React Ref to track where the dropdown is on the screen
  const teamRef = useRef<HTMLDivElement>(null)

  // Listen for clicks to close the dropdown if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamRef.current && !teamRef.current.contains(event.target as Node)) {
        setTeamOpen(false)
      }
    }
    
    // Using 'mousedown' instead of 'click' fixes the React propagation bug
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200">
      {messages.success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
          {messages.success}
        </div>
      )}
      {messages.error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
          {messages.error}
        </div>
      )}

      <form action={updateProfile} className="space-y-6">
        <input type="hidden" name="favorite_team" value={selectedTeam?.name || ''} />

        {/* Email Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('Email Address')}</label>
          <input type="text" disabled value={user.email} className="w-full rounded-xl px-4 py-3 bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed" />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" /> {t('Username')}
          </label>
          <input type="text" name="username" defaultValue={profile?.username || ''} placeholder="e.g. Dracula's Revenge FC" className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green" />
        </div>

        {/* Custom Team Dropdown */}
        <div className="relative" ref={teamRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gray-400" /> {t('Favorite Premier League Team')}
          </label>
          <div 
            onClick={() => setTeamOpen(!teamOpen)}
            className="w-full rounded-md px-4 py-2 bg-white border border-gray-300 cursor-pointer flex items-center justify-between hover:border-gray-400"
          >
            <div className="flex items-center gap-3">
              {selectedTeam ? (
                <>
                  <img src={selectedTeam.logo} alt={selectedTeam.name} className="w-6 h-6 object-contain" />
                  <span>{selectedTeam.name}</span>
                </>
              ) : (
                <span className="text-gray-500">{t('Select a team...')}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          
          {teamOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {PREMIER_LEAGUE_TEAMS.map((team) => (
                <div 
                  key={team.name}
                  onClick={() => { setSelectedTeam(team); setTeamOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-50 transition-colors"
                >
                  <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" />
                  <span className="flex-1">{team.name}</span>
                  {selectedTeam?.name === team.name && <Check className="h-4 w-4 text-scorecaster-green" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quote / Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Quote className="h-4 w-4 text-gray-400" /> {t('Personal Quote / Bio')}
          </label>
          <input
            name="quote"
            value={motto}
            maxLength={18}
            onChange={(event) => setMotto(event.target.value.slice(0, 18))}
            placeholder="Football is a simple game. Twenty-two men chase a ball for 90 minutes..." 
            className="w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green resize-none" 
          />
          <button type="button" onClick={() => setMotto(['Play to win', 'Trust the process', 'Never stop scoring', 'Own the table'][Math.floor(Math.random() * 4)])} className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">{t('Generate motto')}</button>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-3 font-black uppercase tracking-wider text-xs transition-colors shadow-sm">
            {t('Save Profile Changes')}
          </button>
        </div>
      </form>
    </div>
  )
}