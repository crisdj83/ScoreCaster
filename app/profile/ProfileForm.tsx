'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Quote, Trophy, ChevronDown, Check } from 'lucide-react'
import Image from 'next/image'
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

type ProfileFormProps = {
  user: { email?: string | null }
  profile: { username?: string | null; favorite_team?: string | null; quote?: string | null } | null
  messages: { success?: string; error?: string }
}

export default function ProfileForm({ user, profile, messages }: ProfileFormProps) {
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
          <input type="text" disabled value={user.email ?? ''} className="h-12 min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-500 cursor-not-allowed" />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" /> {t('Username')}
          </label>
          <input type="text" name="username" defaultValue={profile?.username || ''} placeholder="e.g. Dracula's Revenge FC" className="focus-frost h-12 min-h-12 w-full rounded-xl border-0 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none ring-0 focus:ring-0 dark:border dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100" />
        </div>

        {/* Custom Team Dropdown */}
        <div className="relative" ref={teamRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gray-400" /> {t('Favorite Premier League Team')}
          </label>
          <div 
            onClick={() => setTeamOpen(!teamOpen)}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-3 text-base hover:border-gray-400"
          >
            <div className="flex items-center gap-3">
              {selectedTeam ? (
                <>
                  <Image src={selectedTeam.logo} alt={selectedTeam.name} width={24} height={24} className="h-6 w-6 object-contain" />
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
                  className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-green-50"
                >
                  <Image src={team.logo} alt={team.name} width={24} height={24} className="h-6 w-6 object-contain" />
                  <span className="flex-1">{team.name}</span>
                  {selectedTeam?.name === team.name && <Check className="h-4 w-4 text-xactscore-green" />}
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
            className="focus-frost h-12 min-h-12 w-full resize-none rounded-xl border-0 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none ring-0 focus:ring-0 dark:border dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100" 
          />
          <button type="button" onClick={() => setMotto(['Play to win', 'Trust the process', 'Never stop scoring', 'Own the table'][Math.floor(Math.random() * 4)])} className="mt-2 min-h-11 select-none rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 touch-manipulation">{t('Generate motto')}</button>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button type="submit" className="min-h-11 select-none rounded-xl bg-gray-900 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-colors touch-manipulation hover:bg-gray-800 dark:font-black">
            {t('Save Profile Changes')}
          </button>
        </div>
      </form>
    </div>
  )
}