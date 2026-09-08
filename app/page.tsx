import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import HeroBanner from './components/HeroBanner'
import { getPLMatches } from '../lib/football'
import { getTranslations } from '../lib/i18n'
import { getServerLocale } from '../lib/i18n-server'
import { findFavoriteTeam } from '../lib/favorite-teams'

// Fetch both the recent scores AND the next scheduled match
async function fetchPLData() {
  try {
    const data = await getPLMatches();

    // 1. Get the Recent Scores (Finished or Live)
    const recentMatchesRaw = data.matches
      .filter((m: any) => ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(m.status))
      .sort((a: any, b: any) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, 5);

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
        homeCrest: nextMatchRaw.homeTeam.crest,
        awayCrest: nextMatchRaw.awayTeam.crest,
        venue: nextMatchRaw.venue || nextMatchRaw.stadium || null,
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

  const selectedTeamData = findFavoriteTeam(profile?.favorite_team)

  return (
    <div className="space-y-3 pb-4 sm:space-y-6 sm:pb-8">
    {searchParams?.success && (
      <div className="rounded-xl border border-orange-500/50 bg-orange-500/15 px-4 py-3 text-sm font-bold text-orange-200">
        {t(searchParams.success)}
      </div>
    )}
      
      <HeroBanner nextMatch={nextMatch} recentScores={recentScores} />

      <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-orange-600 via-zinc-900 to-zinc-950 px-3 py-2.5 shadow-lg shadow-black/30 sm:gap-4 sm:px-5 sm:py-4">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full border border-zinc-700 bg-zinc-800 object-cover sm:h-12 sm:w-12"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-xactscore-accent text-sm font-bold text-xactscore-bg sm:h-12 sm:w-12 sm:text-lg">
            {profile?.username ? profile.username.charAt(0).toUpperCase() : profile?.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3">
          <p className="min-w-0 max-w-[7.5rem] truncate text-sm font-semibold text-zinc-100 sm:max-w-none sm:text-base">
            {profile?.username || t('No username set')}
          </p>
          {profile?.is_global_admin && (
            <span title="Global Admin" className="flex shrink-0 items-center">
              <ShieldCheck className="h-3.5 w-3.5 text-xactscore-accent" />
            </span>
          )}
          <span className="hidden h-3 w-px shrink-0 bg-white/20 sm:block" aria-hidden />
          <span
            className="inline-flex min-w-0 items-center gap-1 text-sm text-zinc-200"
            title={t('Favorite Team:')}
          >
            {selectedTeamData ? (
              <Image
                src={selectedTeamData.crest}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 object-contain"
              />
            ) : null}
            <span className="truncate font-semibold">
              {profile?.favorite_team || t('Not selected')}
            </span>
          </span>
          <span className="h-3 w-px shrink-0 bg-white/20" aria-hidden />
          <span className="shrink-0 text-sm text-zinc-300" title={t('Best league ranking:')}>
            <span className="font-medium text-zinc-400">{t('Best rank')}</span>
            {' '}
            <span className="font-semibold tabular-nums text-zinc-100">
              {bestRanking ? `#${bestRanking.rank}` : '—'}
            </span>
          </span>
        </div>
        <Link
          href="/profile"
          className="shrink-0 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-bold text-orange-100 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20 sm:px-3 sm:py-1.5"
        >
          {t('Edit')}
        </Link>
      </div>
    </div>
  );
}