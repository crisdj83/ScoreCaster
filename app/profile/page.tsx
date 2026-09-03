'use client'

import { useState, useEffect } from 'react'
import { updateProfile } from './actions'
import { User, Shield, Image as ImageIcon, RefreshCw, ArrowLeft, Clock, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

// All 20 Premier League Teams (Using enterprise-grade ESPN CDN for 100% uptime)
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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isPending, setIsPending] = useState(false)
  
  const [favoriteTeam, setFavoriteTeam] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        setProfile(data)
        setFavoriteTeam(data?.favorite_team || '')
        
        if (data?.pending_avatar_url) {
          setAvatarUrl(data.pending_avatar_url)
          setIsPending(true)
        } else {
          setAvatarUrl(data?.avatar_url || '')
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7)
    const newUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}&backgroundColor=e5e7eb`
    setAvatarUrl(newUrl)
    setIsPending(false)
  }

  const selectedTeamData = TEAMS.find(t => t.name === favoriteTeam)

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-6 pb-12">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-scorecaster-green hover:underline text-sm flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-scorecaster-text flex items-center gap-3">
            <User className="h-8 w-8 text-gray-400" />
            Your Profile
          </h1>
        </div>
      </div>

      <div className="mb-4">
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') && (
          <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium">
            {new URLSearchParams(window.location.search).get('success')}
          </div>
        )}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
        <form action={updateProfile} className="space-y-8">
          
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-500" /> Profile Picture / Logo
            </h3>
            
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 relative">
                <div className={`h-32 w-32 rounded-xl border-2 overflow-hidden bg-gray-50 flex items-center justify-center
                  ${isPending ? 'border-amber-400 opacity-75' : 'border-gray-300 border-dashed'}
                `}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">No Image</span>
                  )}
                </div>
                
                {isPending && (
                  <div className="absolute -bottom-3 -right-3 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Clock className="h-3 w-3" /> Pending
                  </div>
                )}
              </div>

              <div className="flex-grow w-full space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input 
                    type="url" 
                    name="avatar_url" 
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setIsPending(false);
                    }}
                    placeholder="Paste a link to an image..."
                    className="w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
                  />
                </div>
                
                <button 
                  type="button" 
                  onClick={generateRandomAvatar}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md px-4 py-2 text-sm font-medium transition-colors border border-gray-200"
                >
                  <RefreshCw className="h-4 w-4" /> Auto-Generate Avatar
                </button>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                name="username" 
                defaultValue={profile?.username || ''}
                required
                placeholder="ScoreMaster99"
                className="w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4 text-scorecaster-green" /> Favorite Team
              </label>
              
              <input type="hidden" name="favorite_team" value={favoriteTeam} />

              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-white text-left rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  {selectedTeamData ? (
                    <>
                      <img 
                        src={selectedTeamData.crest} 
                        alt={selectedTeamData.name} 
                        className="h-5 w-5 object-contain"
                      />
                      <span>{selectedTeamData.name}</span>
                    </>
                  ) : favoriteTeam ? (
                    <span>{favoriteTeam}</span>
                  ) : (
                    <span className="text-gray-400">Select a team...</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                  
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-500 border-b border-gray-100"
                      onClick={() => { setFavoriteTeam(''); setShowDropdown(false); }}
                    >
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">⚽</div>
                      None
                    </div>
                    
                    {TEAMS.map((team) => (
                      <div 
                        key={team.name}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => { setFavoriteTeam(team.name); setShowDropdown(false); }}
                      >
                        <img 
                          src={team.crest} 
                          alt={team.name} 
                          className="h-6 w-6 object-contain"
                        />
                        <span className="text-gray-700">{team.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              className="bg-scorecaster-green hover:bg-green-700 text-white rounded-md px-8 py-3 font-bold transition-colors shadow-sm z-0 relative"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}