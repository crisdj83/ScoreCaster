'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updateProfile } from './actions'
import { User, Shield, Image as ImageIcon, RefreshCw, Clock, ChevronDown } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { useTranslations } from '../components/LocaleProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumb } from '@/components/ui/breadcrumb'

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

function ProfileSuccessBanner() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  if (!success) return null
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-300">
      {success}
    </div>
  )
}

function ProfileLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-2">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-64" />
      </div>
      <Card>
        <CardContent className="space-y-8 p-6 md:p-8">
          <div className="flex flex-col items-start gap-6 md:flex-row">
            <Skeleton className="h-32 w-32 rounded-xl" />
            <div className="w-full flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-11 w-36" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfilePageInner() {
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
          .select('id, email, username, avatar_url, pending_avatar_url, favorite_team, country, quote, is_global_admin')
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

  const selectedTeamData = TEAMS.find(team => team.name === favoriteTeam)

  if (loading) return <ProfileLoadingSkeleton />
  if (loadError) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-300">
        <p className="font-bold">{t('Could not load your profile')}</p>
        <p className="mt-1 text-sm">{loadError}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 uppercase tracking-wider">
          {t('Try Again')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-2">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: t('Your Profile') }]} className="mb-2 hidden md:flex" />
          <h1 className="flex items-center gap-3 text-3xl font-black uppercase tracking-tight text-zinc-100 md:text-4xl">
            <User className="h-8 w-8 text-scorecaster-accent" />
            {t('Your Profile')}
          </h1>
        </div>
      </div>

      <Suspense fallback={null}>
        <ProfileSuccessBanner />
      </Suspense>

      <Card>
        <CardContent className="p-6 md:p-8">
          <form action={updateProfile} className="space-y-8">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-100">
                <ImageIcon className="h-5 w-5 text-scorecaster-accent" /> {t('Profile Picture / Logo')}
              </h3>

              <div className="flex flex-col items-start gap-6 md:flex-row">
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 bg-zinc-950
                    ${isPending ? 'border-amber-400/60 opacity-75' : 'border-dashed border-zinc-700'}
                  `}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm text-zinc-500">{t('No Image')}</span>
                    )}
                  </div>

                  {isPending && (
                    <Badge variant="accent" className="absolute -bottom-3 -right-3 flex items-center gap-1 shadow-sm">
                      <Clock className="h-3 w-3" /> {t('Pending')}
                    </Badge>
                  )}
                </div>

                <div className="w-full flex-grow space-y-3">
                  <div>
                    <Label htmlFor="avatar_url">{t('Image URL')}</Label>
                    <Input
                      id="avatar_url"
                      type="url"
                      name="avatar_url"
                      value={avatarUrl}
                      onChange={(e) => {
                        setAvatarUrl(e.target.value)
                        setIsPending(false)
                      }}
                      placeholder="Paste a link to an image..."
                    />
                  </div>

                  <Button type="button" variant="secondary" onClick={generateRandomAvatar}>
                    <RefreshCw className="h-4 w-4" /> {t('Auto-Generate Avatar')}
                  </Button>
                </div>
              </div>
            </div>

            <hr className="border-zinc-800" />

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="username">{t('Username')}</Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  defaultValue={profile?.username || ''}
                  required
                  placeholder="ScoreMaster99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote">{t('Player motto')}</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="quote"
                    type="text"
                    name="quote"
                    value={motto}
                    maxLength={18}
                    onChange={(event) => setMotto(event.target.value.slice(0, 18))}
                    placeholder={t('Enter a short motto')}
                    className="min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setMotto(
                        ['Play to win', 'Trust the process', 'Never stop scoring', 'Own the table'][
                          Math.floor(Math.random() * 4)
                        ]
                      )
                    }
                  >
                    {t('Generate motto')}
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">{motto.length}/18</p>
              </div>

              <div className="relative">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-scorecaster-accent" /> {t('Favorite Team')}
                </Label>

                <input type="hidden" name="favorite_team" value={favoriteTeam} />

                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="focus-frost flex h-11 w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-left text-sm text-zinc-100 outline-none ring-0 transition-[border-color,box-shadow] focus:ring-0"
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
                      <span className="text-zinc-500">{t('Select a team...')}</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />

                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg shadow-black/40">
                      <div
                        className="flex cursor-pointer items-center gap-3 border-b border-zinc-800 px-4 py-3 text-zinc-500 hover:bg-zinc-800"
                        onClick={() => {
                          setFavoriteTeam('')
                          setShowDropdown(false)
                        }}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px]">
                          ⚽
                        </div>
                        {t('None')}
                      </div>

                      {TEAMS.map((team) => (
                        <div
                          key={team.name}
                          className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-zinc-800"
                          onClick={() => {
                            setFavoriteTeam(team.name)
                            setShowDropdown(false)
                          }}
                        >
                          <img src={team.crest} alt={team.name} className="h-6 w-6 object-contain" />
                          <span className="text-zinc-200">{team.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-800 pt-4">
              <Button type="submit" className="relative z-0 uppercase tracking-wider">
                {t('Save Profile')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingSkeleton />}>
      <ProfilePageInner />
    </Suspense>
  )
}
