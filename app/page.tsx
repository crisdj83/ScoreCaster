import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react'
import HeroBanner from './components/HeroBanner'
import ScoreCasterLogo from './components/ScoreCasterLogo'
import { getPLMatches } from '../lib/football'
import { getTranslations } from '../lib/i18n'
import { getServerLocale } from '../lib/i18n-server'
import ContestIcon from './components/ContestIcon'
import { getSeasonLengthLabelKey } from '../lib/contest-season'

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

async function fetchAnalytics() {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) return null

  const params = new URLSearchParams({
    projectId,
    since: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    until: new Date().toISOString(),
  })
  if (process.env.VERCEL_TEAM_ID) params.set('teamId', process.env.VERCEL_TEAM_ID)

  let response: Response
  try {
    response = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/count?${params}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    )
  } catch (error) {
    console.error('Vercel Analytics Request Error:', error)
    return null
  }
  if (!response.ok) {
    console.error('Vercel Analytics API Error:', response.status)
    return null
  }

  const payload = await response.json() as { data?: Array<{ pageviews?: number; visitors?: number }> | { pageviews?: number; visitors?: number } }
  const rows = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : []
  return {
    pageviews: rows.reduce((total, row) => total + (Number(row.pageviews) || 0), 0),
    visitors: rows.reduce((total, row) => total + (Number(row.visitors) || 0), 0),
  }
}

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

  const [{ data: profile }, { data: myContests }, plData, analytics] = await Promise.all([
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
    fetchAnalytics(),
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
        <ScoreCasterLogo />
      </div>

      {/* HeroBanner is fully driven by the real API */}
      <HeroBanner nextMatch={nextMatch} recentScores={recentScores} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 rounded-2xl border border-zinc-800 bg-gradient-to-br from-orange-600 via-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/30 md:col-span-1">
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">{t('Your Profile')}</h2>
            <Link href="/profile" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-100 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20">{t('Edit')}</Link>
          </div>
          
          <div className="mb-4 flex items-center space-x-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-12 w-12 rounded-full border border-zinc-700 bg-zinc-800 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-scorecaster-accent text-lg font-bold text-scorecaster-bg">
                {profile?.username ? profile.username.charAt(0).toUpperCase() : profile?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-zinc-100">{profile?.username || t('No username set')}</p>
                {profile?.is_global_admin && (
                  <span title="Global Admin" className="flex items-center">
                    <ShieldCheck className="h-4 w-4 text-scorecaster-accent" />
                  </span>
                )}
              </div>
              <p className="max-w-[150px] truncate text-sm text-zinc-500">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <span className="font-medium text-zinc-500">{t('Favorite Team:')}</span>
              
              <div className="flex items-center gap-2">
                {selectedTeamData && (
                  <Image
                    src={selectedTeamData.crest}
                    alt={`${selectedTeamData.name} Logo`}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                )}
                <span className="font-semibold text-zinc-100">
                  {profile?.favorite_team || t('Not selected')}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-500">{t('Best league ranking:')}</span>
              <span className="font-semibold text-zinc-100">
                {bestRanking ? `#${bestRanking.rank} (${bestRanking.year})` : t('Not ranked yet')}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-1 rounded-2xl border border-zinc-800 bg-gradient-to-bl from-orange-600 via-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/30 md:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">{t('My Contests')}</h2>
            <Link href="/contests" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-100 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20">{t('View Hub')}</Link>
          </div>
          
          {!myContests || myContests.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 text-zinc-500">
              <p>{t("You haven't joined any contests yet.")}</p>
              <Link href="/contests" className="mt-1 text-sm font-medium text-scorecaster-accent hover:underline">{t('Join or Create one')}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {myContests.map((membership: any) => (
                <Link 
                  key={membership.contest_id} 
                  href={`/contests/${membership.contest_id}`}
                  className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-scorecaster-accent/50 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <ContestIcon contestId={membership.contest_id} size="sm" />
                    <div className="truncate">
                      <p className="truncate font-bold text-zinc-100">{membership.contests.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{t('Role:')} {membership.role === 'admin' ? t('Admin') : t('Member')} · {t(getSeasonLengthLabelKey(membership.contests.season_length))}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-scorecaster-accent" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <section className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-scorecaster-accent" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-zinc-100">{t('Analytics')}</h2>
            {analytics ? (
              <p className="text-sm text-zinc-400">
                {analytics.visitors} {t('visitors')} · {analytics.pageviews} {t('page views')} {t('today')}
              </p>
            ) : (
              <p className="text-sm text-zinc-400">{t('Live data is unavailable.')}</p>
            )}
          </div>
        </div>
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-100 transition hover:border-white/40 hover:bg-white/20"
        >
          {t('Open Dashboard')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}