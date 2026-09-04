'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from './actions'
import { User, Shield, Image as ImageIcon, RefreshCw, ArrowLeft, Clock, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { useTranslations } from '../components/LocaleProvider'

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
  const router = useRouter()
  const t = useTranslations()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isPending, setIsPending] = useState(false)
  
  const [favoriteTeam, setFavoriteTeam] = useState('')
  const [motto, setMotto] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) {
          router.replace('/login')
          return
        }

        const { data, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profileError) throw profileError

        setProfile(data)
        setFavoriteTeam(data?.favorite_team || '')
        setMotto(data?.quote || '')
        if (data?.pending_avatar_url) {
          setAvatarUrl(data.pending_avatar_url)
          setIsPending(true)
        } else {
          setAvatarUrl(data?.avatar_url || '')
        }
      } catch (error) {
        console.error('Profile load error:', error)
        setLoadError(error instanceof Error ? error.message : 'Unable to load your profile.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [router])

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7)
    const newUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}&backgroundColor=e5e7eb`
    setAvatarUrl(newUrl)
    setIsPending(false)
  }

  const selectedTeamData = TEAMS.find(t => t.name === favoriteTeam)

  if (loading) return <div className="p-8 text-center text-gray-500">{t('Loading profile...')}</div>
  if (loadError) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p className="font-bold">{t('Could not load your profile')}</p>
        <p className="mt-1 text-sm">{loadError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white">
          {t('Try Again')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-2 pb-12">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> {t('Back to Dashboard')}
          </Link>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-3">
            <User className="h-8 w-8 text-scorecaster-green" />
            {t('Your Profile')}
          </h1>
        </div>
      </div>

      <div className="mb-4">
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') && (
          <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
            {new URLSearchParams(window.location.search).get('success')}
          </div>
        )}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200">
        <form action={updateProfile} className="space-y-8">
          
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-500" /> {t('Profile Picture / Logo')}
            </h3>
            
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 relative">
                <div className={`h-32 w-32 rounded-xl border-2 overflow-hidden bg-gray-50 flex items-center justify-center
                  ${isPending ? 'border-amber-400 opacity-75' : 'border-gray-300 border-dashed'}
                `}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">{t('No Image')}</span>
                  )}
                </div>
                
                {isPending && (
                  <div className="absolute -bottom-3 -right-3 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Clock className="h-3 w-3" /> {t('Pending')}
                  </div>
                )}
              </div>

              <div className="flex-grow w-full space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Image URL')}</label>
                  <input 
                    type="url" 
                    name="avatar_url" 
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setIsPending(false);
                    }}
                    placeholder="Paste a link to an image..."
                    className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
                  />
                </div>
                
                <button 
                  type="button" 
                  onClick={generateRandomAvatar}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors border border-gray-200"
                >
                  <RefreshCw className="h-4 w-4" /> {t('Auto-Generate Avatar')}
                </button>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Username')}</label>
              <input 
                type="text" 
                name="username" 
                defaultValue={profile?.username || ''}
                required
                placeholder="ScoreMaster99"
                className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('Player motto')}</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  name="quote"
                  value={motto}
                  maxLength={18}
                  onChange={(event) => setMotto(event.target.value.slice(0, 18))}
                  placeholder={t('Enter a short motto')}
                  className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
                />
                <button
                  type="button"
                  onClick={() => setMotto(['Play to win', 'Trust the process', 'Never stop scoring', 'Own the table'][Math.floor(Math.random() * 4)])}
                  className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-200"
                >
                  {t('Generate motto')}
                </button>
              </div>
              <p className="text-xs text-gray-500">{motto.length}/18</p>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4 text-scorecaster-green" /> {t('Favorite Team')}
              </label>
              
              <input type="hidden" name="favorite_team" value={favoriteTeam} />

              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-[#0d0d0d] text-white text-left rounded-xl px-4 py-3 border border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-scorecaster-green flex justify-between items-center"
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
                    <span className="text-gray-400">{t('Select a team...')}</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                  
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <div 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-500 border-b border-gray-100"
                      onClick={() => { setFavoriteTeam(''); setShowDropdown(false); }}
                    >
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">⚽</div>
                      {t('None')}
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
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-8 py-3 font-black uppercase tracking-wider text-xs transition-colors shadow-sm z-0 relative"
            >
              {t('Save Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}