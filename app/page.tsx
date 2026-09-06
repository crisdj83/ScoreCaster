import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import HeroBanner from './components/HeroBanner'
import XactScoreLogo from './components/XactScoreLogo'
import { getPLMatches } from '../lib/football'
import { getTranslations } from '../lib/i18n'
import { getServerLocale } from '../lib/i18n-server'

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

// Fetch both the recent scores AND the next scheduled match
async function fetchPLData() {
  try {
    const data = await getPLMatches();

    // 1. Get the Recent Scores (Finished or Live)
    const recentMatchesRaw = data.matches
      .filter((m: any) => ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(m.status))
      .sort((a: any, b: any) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, 8);

    const recentScores = recentMatchesRaw.map((m: any) => ({
      id: m.id,
      homeTeam: m.homeTeam.shortName || m.homeTeam.name,
      awayTeam: m.awayTeam.shortName || m.awayTeam.name,
      homeCrest: m.homeTeam.crest,
      awayCrest: m.awayTeam.crest,
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
      status: m.status === 'FINISHED' ? 'FT' : 'LIVE'
    }));

    // 2. Get the Next Upcoming Match
    const now = Date.now();
    const nextMatchRaw = data.matches
      .filter((m: any) => ['SCHEDULED', 'TIMED'].includes(m.status))
      .filter((m: any) => new Date(m.utcDate).getTime() > now)
      // Sort ascending to get the closest future match
      .sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];

    let nextMatch = null;
    if (nextMatchRaw) {
      nextMatch = {
        date: nextMatchRaw.utcDate,
        homeTeam: nextMatchRaw.homeTeam.shortName || nextMatchRaw.homeTeam.name,
        awayTeam: nextMatchRaw.awayTeam.shortName || nextMatchRaw.awayTeam.name,
      }
    }

    return { recentScores, nextMatch };
  } catch (error) {
    console.error("API Fetch Error:", error);
    return { recentScores: [], nextMatch: null };
  }
}

export default async function Home(props: { searchParams: Promise<{ success?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const t = getTranslations(getServerLocale())

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: myContests }, plData] = await Promise.all([
    supabase.from('users').select('username, email, avatar_url, favorite_team, is_global_admin').eq('id', user.id).single(),
    supabase.from('contest_members').select(`
      contest_id,
      role,
      contests (
        name,
        contest_key,
        season_length,
        created_at
      )
    `).eq('user_id', user.id),
    fetchPLData(),
  ])
  const { recentScores, nextMatch } = plData
  const contestIds = (myContests || []).map(membership => membership.contest_id)
  const { data: contestPredictions } = contestIds.length
    ? await supabase.from('predictions').select('contest_id, user_id, points').in('contest_id', contestIds)
    : { data: [] }
  const bestRanking = (myContests || []).reduce<{ rank: number; year: number } | null>((best, membership) => {
    const members = new Map<string, number>()
    ;(contestPredictions || [])
      .filter(prediction => prediction.contest_id === membership.contest_id)
      .forEach(prediction => members.set(prediction.user_id, (members.get(prediction.user_id) || 0) + (Number(prediction.points) || 0)))
    const sortedScores = Array.from(members.entries()).sort((a, b) => b[1] - a[1])
    const rank = sortedScores.findIndex(([userId]) => userId === user.id) + 1
    if (!rank) return best
    const createdAt = (membership.contests as { created_at?: string } | null)?.created_at
    const current = { rank, year: createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear() }
    return !best || current.rank < best.rank ? current : best
  }, null)

  const selectedTeamData = TEAMS.find(team => team.name === profile?.favorite_team)

  return (
    <div className="space-y-8 pb-12">
    {searchParams?.success && (
      <div className="rounded-xl border border-orange-500/50 bg-orange-500/15 px-4 py-3 text-sm font-bold text-orange-200">
        {t(searchParams.success)}
      </div>
    )}
      
      <div className="flex flex-col items-center gap-5 pt-2 pb-2">
        <XactScoreLogo />
      </div>

      {/* HeroBanner is fully driven by the real API */}
      <HeroBanner nextMatch={nextMatch} recentScores={recentScores} />

      <div className="w-full rounded-2xl border border-zinc-800 bg-gradient-to-br from-orange-600 via-zinc-900 to-zinc-950 p-5 shadow-lg shadow-black/30 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">{t('Your Profile')}</h2>
            <Link href="/profile" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-100 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20">{t('Edit')}</Link>
          </div>
          
          <div className="mb-4 flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-14 w-14 shrink-0 rounded-full border border-zinc-700 bg-zinc-800 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-xactscore-accent text-lg font-bold text-xactscore-bg">
                {profile?.username ? profile.username.charAt(0).toUpperCase() : profile?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-zinc-100">{profile?.username || t('No username set')}</p>
                {profile?.is_global_admin && (
                  <span title="Global Admin" className="flex shrink-0 items-center">
                    <ShieldCheck className="h-4 w-4 text-xactscore-accent" />
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-zinc-500">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between gap-3 text-sm text-zinc-400">
              <span className="shrink-0 font-medium text-zinc-500">{t('Favorite Team:')}</span>
              
              <div className="flex min-w-0 items-center gap-2">
                {selectedTeamData && (
                  <Image
                    src={selectedTeamData.crest}
                    alt={`${selectedTeamData.name} Logo`}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                )}
                <span className="truncate font-semibold text-zinc-100">
                  {profile?.favorite_team || t('Not selected')}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="shrink-0 font-medium text-zinc-500">{t('Best league ranking:')}</span>
              <span className="truncate font-semibold text-zinc-100">
                {bestRanking ? `#${bestRanking.rank} (${bestRanking.year})` : t('Not ranked yet')}
              </span>
            </div>
          </div>
      </div>
    </div>
  );
}