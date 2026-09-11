import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPLMatches } from '../../../../lib/football'
import { getMatchVenues } from '../../../../lib/goal-api'
import { isMatchInContestSeason } from '../../../../lib/contest-season'
import { getActiveMatchday, isOpenForPrediction } from '../../../../lib/scoring'
import { findFavoriteTeam } from '../../../../lib/favorite-teams'

type PLMatch = {
  id: number | string
  utcDate: string
  status?: string
  matchday?: number | null
  venue?: string
  stadium?: string
  homeTeam: { name: string; shortName?: string; crest?: string }
  awayTeam: { name: string; shortName?: string; crest?: string }
  score?: {
    fullTime?: { home?: number | null; away?: number | null }
    halfTime?: { home?: number | null; away?: number | null }
  }
}

async function fetchPLData() {
  try {
    const data = await getPLMatches()
    const matches = (data.matches || []) as PLMatch[]

    const recentScores = matches
      .filter((m) => ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(m.status || ''))
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, 5)
      .map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.shortName || m.homeTeam.name,
        awayTeam: m.awayTeam.shortName || m.awayTeam.name,
        homeCrest: m.homeTeam.crest,
        awayCrest: m.awayTeam.crest,
        homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
        awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
        status: m.status === 'FINISHED' ? 'FT' : 'LIVE',
      }))

    const now = Date.now()
    const nextMatchRaw = matches
      .filter((m) => ['SCHEDULED', 'TIMED'].includes(m.status || ''))
      .filter((m) => new Date(m.utcDate).getTime() > now)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0]

    let nextMatch = null
    if (nextMatchRaw) {
      let venue: string | null = nextMatchRaw.venue || nextMatchRaw.stadium || null
      try {
        const venues = await getMatchVenues([nextMatchRaw])
        venue = venues.get(String(nextMatchRaw.id)) || venue
      } catch {
        // Venue enrichment is optional for mobile home.
      }
      nextMatch = {
        date: nextMatchRaw.utcDate,
        homeTeam: nextMatchRaw.homeTeam.shortName || nextMatchRaw.homeTeam.name,
        awayTeam: nextMatchRaw.awayTeam.shortName || nextMatchRaw.awayTeam.name,
        homeCrest: nextMatchRaw.homeTeam.crest,
        awayCrest: nextMatchRaw.awayTeam.crest,
        venue,
      }
    }

    return { matches, recentScores, nextMatch }
  } catch (error) {
    console.error('mobile home PL fetch failed', error)
    return { matches: [] as PLMatch[], recentScores: [], nextMatch: null }
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [{ data: profile }, { data: myContests }, plData] = await Promise.all([
    supabase
      .from('users')
      .select('username, email, avatar_url, favorite_team, is_global_admin')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('contest_members')
      .select(
        `
      contest_id,
      role,
      contests (
        name,
        contest_key,
        season_length,
        created_at
      )
    `
      )
      .eq('user_id', user.id),
    fetchPLData(),
  ])

  const { matches, recentScores, nextMatch } = plData
  const contestIds = (myContests || []).map((membership) => membership.contest_id)
  const { data: contestPredictions } = contestIds.length
    ? await supabase
        .from('predictions')
        .select('contest_id, user_id, points, match_id, predicted_home_score')
        .in('contest_id', contestIds)
    : { data: [] }

  const now = Date.now()
  const leagues = (myContests || []).map((membership) => {
    const contest = membership.contests as {
      name?: string
      season_length?: string
    } | null
    const members = new Map<string, number>()
    ;(contestPredictions || [])
      .filter((prediction) => prediction.contest_id === membership.contest_id)
      .forEach((prediction) =>
        members.set(prediction.user_id, (members.get(prediction.user_id) || 0) + (Number(prediction.points) || 0))
      )
    const sortedScores = Array.from(members.entries()).sort((a, b) => b[1] - a[1])
    const rank = sortedScores.findIndex(([userId]) => userId === user.id) + 1
    const predicted = new Set(
      (contestPredictions || [])
        .filter(
          (prediction) =>
            prediction.contest_id === membership.contest_id &&
            prediction.user_id === user.id &&
            prediction.predicted_home_score !== null &&
            prediction.predicted_home_score !== undefined
        )
        .map((prediction) => String(prediction.match_id))
    )
    const seasonMatches = matches.filter((match) => isMatchInContestSeason(match, contest?.season_length))
    const matchday = getActiveMatchday(seasonMatches, now)
    const openPicks =
      matchday == null
        ? 0
        : seasonMatches.filter(
            (match) =>
              Number(match.matchday) === matchday &&
              isOpenForPrediction(match, now) &&
              !predicted.has(String(match.id))
          ).length

    return {
      contestId: membership.contest_id,
      name: contest?.name || 'Contests',
      openPicks,
      rank: rank || null,
    }
  })

  const bestRanking = leagues.reduce<{ rank: number } | null>((best, league) => {
    if (!league.rank) return best
    return !best || league.rank < best.rank ? { rank: league.rank } : best
  }, null)

  const firstOpen = leagues.find((league) => league.openPicks > 0)
  const predictPath = firstOpen
    ? `/contests/${firstOpen.contestId}/predictions`
    : leagues[0]
      ? `/contests/${leagues[0].contestId}/predictions`
      : '/contests'

  const favorite = findFavoriteTeam(profile?.favorite_team)

  return NextResponse.json({
    profile: {
      username: profile?.username ?? null,
      email: profile?.email ?? user.email ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      favoriteTeam: profile?.favorite_team ?? null,
      favoriteCrest: favorite?.crest ?? null,
      isGlobalAdmin: profile?.is_global_admin === true,
    },
    leagues,
    bestRank: bestRanking?.rank ?? null,
    nextMatch,
    recentScores,
    predictPath,
  })
}
