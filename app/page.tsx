import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react'
import HeroBanner from './components/HeroBanner'
import ScoreCasterLogo from './components/ScoreCasterLogo'
import { getPLMatches } from '../lib/football'
import { getTranslations } from '../lib/i18n'
import { getServerLocale } from '../lib/i18n-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Analytics } from '@vercel/analytics/next'
import HomepageUpdates from './components/HomepageUpdates'
import ContestIcon from './components/ContestIcon'

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
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
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
    const nextMatchRaw = data.matches
      .filter((m: any) => ['SCHEDULED', 'TIMED'].includes(m.status))
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

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: myContests } = await supabase
    .from('contest_members')
    .select(`
      contest_id,
      role,
      contests (
        name,
        contest_key,
        season_length
      )
    `)
    .eq('user_id', user.id)

  const selectedTeamData = TEAMS.find(t => t.name === profile?.favorite_team)
  
  // Fetch data
  const { recentScores, nextMatch } = await fetchPLData();
  const analytics = await fetchAnalytics()
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: websiteUpdates } = await serviceSupabase
    .from('news_posts')
    .select('id, title, body, created_at')
    .order('created_at', { ascending: false })
    .limit(8)
  const { data: rankingMemberships } = await supabase
    .from('contest_members')
    .select('contest_id')
    .eq('user_id', user.id)
  const contestIds = (rankingMemberships || []).map(membership => membership.contest_id)
  const { data: rankingContests } = contestIds.length
    ? await supabase.from('contests').select('id, created_at').in('id', contestIds)
    : { data: [] }
  const { data: contestPredictions } = contestIds.length
    ? await supabase.from('predictions').select('contest_id, user_id, points_earned').in('contest_id', contestIds)
    : { data: [] }
  const bestRanking = (rankingMemberships || []).reduce<{ rank: number; year: number } | null>((best, membership) => {
    const members = new Map<string, number>()
    ;(contestPredictions || [])
      .filter(prediction => prediction.contest_id === membership.contest_id)
      .forEach(prediction => members.set(prediction.user_id, (members.get(prediction.user_id) || 0) + (Number(prediction.points_earned) || 0)))
    const sortedScores = Array.from(members.entries()).sort((a, b) => b[1] - a[1])
    const rank = sortedScores.findIndex(([userId]) => userId === user.id) + 1
    if (!rank) return best
    const createdAt = rankingContests?.find(contest => contest.id === membership.contest_id)?.created_at
    const current = { rank, year: createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear() }
    return !best || current.rank < best.rank ? current : best
  }, null)

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
        <div className="bg-gradient-to-br from-orange-600 via-[#242424] to-[#0d0d0d] p-6 rounded-2xl shadow-lg shadow-black/30 border border-blue-900/80 col-span-1 md:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-scorecaster-text">{t('Your Profile')}</h2>
            <Link href="/profile" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-100 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20">{t('Edit')}</Link>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="h-12 w-12 rounded-full object-cover border border-gray-200 bg-gray-50"
              />
            ) : (
              <div className="rounded-full bg-scorecaster-green text-white h-12 w-12 flex items-center justify-center font-bold text-lg">
                {profile?.username ? profile.username.charAt(0).toUpperCase() : profile?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-scorecaster-text">{profile?.username || t('No username set')}</p>
                {profile?.is_global_admin && (
                  <span title="Global Admin" className="flex items-center">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate max-w-[150px]">{profile?.email}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            <div className="text-sm text-gray-600 flex justify-between items-center">
              <span className="font-medium text-gray-500">{t('Favorite Team:')}</span>
              
              <div className="flex items-center gap-2">
                {selectedTeamData && (
                  <img 
                    src={selectedTeamData.crest} 
                    alt={`${selectedTeamData.name} Logo`} 
                    className="h-5 w-5 object-contain"
                  />
                )}
                <span className="font-semibold text-scorecaster-text">
                  {profile?.favorite_team || t('Not selected')}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-500">{t('Best league ranking:')}</span>
              <span className="font-semibold text-scorecaster-text">
                {bestRanking ? `#${bestRanking.rank} (${bestRanking.year})` : t('Not ranked yet')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-bl from-orange-600 via-[#242424] to-[#0d0d0d] p-6 rounded-2xl shadow-lg shadow-black/30 border border-blue-900/80 col-span-1 md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-scorecaster-text">{t('My Contests')}</h2>
            <Link href="/contests" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-100 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20">{t('View Hub')}</Link>
          </div>
          
          {!myContests || myContests.length === 0 ? (
            <div className="border-2 border-dashed border-orange-500/30 rounded-xl h-32 flex flex-col items-center justify-center text-gray-400 bg-[#242424]">
              <p>{t("You haven't joined any contests yet.")}</p>
              <Link href="/contests" className="text-scorecaster-green text-sm font-medium hover:underline mt-1">{t('Join or Create one')}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myContests.map((membership: any) => (
                <Link 
                  key={membership.contest_id} 
                  href={`/contests/${membership.contest_id}`}
                  className="flex items-center justify-between p-4 border border-orange-500/25 rounded-xl bg-[#242424] hover:border-orange-400 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <ContestIcon contestId={membership.contest_id} size="sm" />
                    <div className="truncate">
                      <p className="font-bold text-scorecaster-text truncate">{membership.contests.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t('Role:')} {membership.role === 'admin' ? t('Admin') : t('Member')} · {membership.contests.season_length === 'half' ? t('Half season') : t('Full season')}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-scorecaster-green" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <HomepageUpdates
        updates={websiteUpdates || []}
        isOwner={user.email?.toLowerCase() === 'cris.the.dj@gmail.com'}
      />
      <section className="flex items-center justify-between gap-4 rounded-2xl border border-orange-500/25 bg-gradient-to-r from-[#242424] to-[#171717] p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-orange-300" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-scorecaster-text">{t('Analytics')}</h2>
            {analytics ? (
              <p className="text-sm text-gray-400">
                {analytics.visitors} {t('visitors')} · {analytics.pageviews} {t('page views')} {t('today')}
              </p>
            ) : (
              <p className="text-sm text-gray-400">{t('Live data is unavailable.')}</p>
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
      <footer className="flex flex-col items-center gap-2 py-2 text-center">
        <p className="max-w-xl text-xs font-medium tracking-wide text-orange-100/70">
          Built with 10% skill, 90% Googling, and love from Sfariac Cristian.
        </p>
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300/70">
          <span aria-hidden="true">©</span>
          <span>ScoreCaster</span>
        </p>
      </footer>
      <Analytics />
    </div>
  );
}