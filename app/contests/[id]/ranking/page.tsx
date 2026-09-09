import { createClient } from '../../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { getPLMatches, getPLStandings } from '../../../../lib/football'
import { getLiveGoalScorers } from '../../../../lib/api-football'
import { loadStoredScorers, persistMatchScorers } from '../../../../lib/match-scorers'
import {
  getSeasonLengthLabelKey,
  isMatchInContestSeason,
  normalizeSeasonLength,
} from '../../../../lib/contest-season'
import {
  calculatePoints,
  getOfficialScore,
  isPredictionLocked,
  isPredictionRevealable,
  resolveContestScoring,
  type ContestScoring,
} from '../../../../lib/scoring'
import { Target, Activity, CheckCircle2, Gauge, ArrowUp, ArrowDown } from 'lucide-react'
import Image from 'next/image'
import RankingInsights from './RankingInsights'
import CurrentGameweek from './CurrentGameweek'
import LiveRefresh from '../../../components/LiveRefresh'
import { RankTable, type RankColumn } from '@/components/ui/rank-table'
import { ScoreBadge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { isUnoptimizedAvatar } from '../../../../lib/soccer-avatar'

type MatchGoal = {
  minute?: number
  injuryTime?: number | null
  type?: string
  team?: { id?: number | string; name?: string }
  scorer?: { id?: number | string; name?: string }
}

type Match = {
  id: number | string
  matchday?: number
  utcDate: string
  status?: string
  homeTeam: { id?: number | string; name: string; shortName?: string; crest?: string }
  awayTeam: { id?: number | string; name: string; shortName?: string; crest?: string }
  score?: {
    fullTime?: { home?: number | null; away?: number | null }
    halfTime?: { home?: number | null; away?: number | null }
  }
  goals?: MatchGoal[]
}

type Prediction = {
  user_id: string
  match_id: number | string
  predicted_home_score: number
  predicted_away_score: number
  points_earned: number | null
  is_exact?: boolean | null
  is_correct?: boolean | null
}

type MemberProfile = {
  username?: string | null
  email?: string | null
  quote?: string | null
  avatar_url?: string | null
}

type ContestMember = {
  user_id: string
  users: MemberProfile | MemberProfile[] | null
}

type RpcPrediction = {
  user_id: string
  match_id: number | string
  predicted_home_score: number | null
  predicted_away_score: number | null
  points?: number | null
  is_exact?: boolean | null
  is_correct?: boolean | null
}

type PlTableRow = {
  position?: number
  form?: string
  team?: { id?: number | string; name?: string }
}

type PlStandingsData = {
  standings?: Array<{
    type?: string
    table?: PlTableRow[]
  }>
}

function pointsForPrediction(prediction: Prediction, match: Match | undefined, scoring: ContestScoring) {
  if (!match) return null
  const score = getOfficialScore(match)
  if (!score) return null
  return calculatePoints(
    prediction.predicted_home_score,
    prediction.predicted_away_score,
    score.home,
    score.away,
    scoring
  )
}

function outcomeFromPoints(points: number | null, scoring: ContestScoring) {
  if (points === null) return ''
  if (points === scoring.exact) return 'E'
  if (points === scoring.close) return 'C'
  if (points === scoring.result) return 'R'
  return points > 0 ? 'R' : '0'
}

function displayName(member: ContestMember) {
  const user = Array.isArray(member.users) ? member.users[0] : member.users
  return user?.username || user?.email?.split('@')[0] || 'Unknown Player'
}

function lastName(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] || name
}

function formatGoalMinute(goal: MatchGoal) {
  const minute = Number(goal.minute) || 0
  const injury = Number(goal.injuryTime) || 0
  return injury > 0 ? `${minute}+${injury}'` : `${minute}'`
}

function scorersForTeam(goals: MatchGoal[] | undefined, team: Match['homeTeam']) {
  const teamGoals = (goals || []).filter((goal) => {
    if (team.id != null && goal.team?.id != null) return String(goal.team.id) === String(team.id)
    return Boolean(team.name && goal.team?.name === team.name)
  })
  const order: string[] = []
  const byPlayer = new Map<string, { name: string; bits: string[] }>()
  for (const goal of teamGoals) {
    const key = String(goal.scorer?.id ?? goal.scorer?.name ?? `${goal.minute}`)
    const suffix = goal.type === 'OWN' ? ' og' : goal.type === 'PENALTY' ? ' pen' : ''
    const name = lastName(goal.scorer?.name || 'Goal')
    let entry = byPlayer.get(key)
    if (!entry) {
      entry = { name, bits: [] }
      byPlayer.set(key, entry)
      order.push(key)
    }
    entry.bits.push(`${formatGoalMinute(goal)}${suffix}`)
  }
  return order.map((key) => {
    const entry = byPlayer.get(key)!
    return `${entry.name} ${entry.bits.join(', ')}`
  })
}

function ranksFromFinishedMatches(
  members: { user_id: string }[],
  finishedMatches: Match[],
  predictions: Prediction[],
  matchById: Map<string, Match>,
  scoring: ContestScoring
) {
  const allowed = new Set(finishedMatches.map((match) => String(match.id)))
  const totals = new Map(
    members.map((member) => [member.user_id, { points: 0, exact: 0, close: 0, scored: 0, correct: 0 }])
  )
  for (const prediction of predictions) {
    if (!allowed.has(String(prediction.match_id))) continue
    const result = pointsForPrediction(prediction, matchById.get(String(prediction.match_id)), scoring)
    if (!result) continue
    const current = totals.get(prediction.user_id)
    if (!current) continue
    current.points += result.points
    current.scored += 1
    if (result.points > 0) current.correct += 1
    if (result.points === scoring.exact) current.exact += 1
    else if (result.points === scoring.close) current.close += 1
  }
  const ranked = members.map((member) => {
    const current = totals.get(member.user_id)!
    return {
      playerId: member.user_id,
      points: current.points,
      exact: current.exact,
      close: current.close,
      accuracy: current.scored ? current.correct / current.scored : 0,
    }
  }).sort((a, b) => b.points - a.points || b.exact - a.exact || b.close - a.close || b.accuracy - a.accuracy)

  return new Map(
    ranked.map((player) => [
      player.playerId,
      ranked.findIndex(
        (item) =>
          item.points === player.points &&
          item.exact === player.exact &&
          item.close === player.close &&
          item.accuracy === player.accuracy
      ) + 1,
    ])
  )
}

function RankMovement({
  current,
  previous,
  upLabel,
  downLabel,
  sameLabel,
}: {
  current: number
  previous: number | null
  upLabel: string
  downLabel: string
  sameLabel: string
}) {
  if (previous == null || previous === current) {
    return (
      <span
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center"
        title={sameLabel}
        aria-label={sameLabel}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
      </span>
    )
  }

  if (current < previous) {
    return (
      <span className="inline-flex shrink-0" title={upLabel} aria-label={upLabel}>
        <ArrowUp className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.75} aria-hidden />
      </span>
    )
  }

  return (
    <span className="inline-flex shrink-0" title={downLabel} aria-label={downLabel}>
      <ArrowDown className="h-3.5 w-3.5 text-red-400" strokeWidth={2.75} aria-hidden />
    </span>
  )
}

function PlayerAvatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 rounded-full object-cover"
        unoptimized={isUnoptimizedAvatar(src)}
      />
    )
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[9px] font-bold text-zinc-400">
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function ScoringChip({
  icon: Icon,
  value,
  label,
  iconClassName,
}: {
  icon: typeof Target
  value: number
  label: string
  iconClassName: string
}) {
  return (
    <span
      className="inline-flex w-10 shrink-0 items-center justify-center gap-0.5 py-0.5"
      title={`${label}: ${value}`}
      aria-label={`${label}: ${value}`}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClassName}`} aria-hidden />
      <span className="w-4 text-center text-[11px] font-bold tabular-nums text-zinc-200">{value}</span>
    </span>
  )
}

export default async function RankingPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ matchId?: string }> }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contest } = await supabase
    .from('contests')
    .select('points_exact, points_close, points_result, season_length')
    .eq('id', params.id)
    .single()

  if (!contest) notFound()

  const scoring = resolveContestScoring(contest)
  const ptsExact = scoring.exact
  const ptsClose = scoring.close
  const ptsResult = scoring.result
  const seasonLength = normalizeSeasonLength(contest.season_length)
  const [matchData, standingsData] = await Promise.all([
    getPLMatches(),
    getPLStandings().catch(() => null),
  ])
  const matches: Match[] = (matchData.matches || [])
    .filter((match: Match) => isMatchInContestSeason(match, seasonLength))
    .sort((a: Match, b: Match) => Number(a.matchday) - Number(b.matchday) || new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
  const allowedMatchIds = matches.map(match => String(match.id))
  const liveNow = matches.filter((match) => ['IN_PLAY', 'PAUSED'].includes(match.status || ''))
  const selectedFromUrl = searchParams.matchId
    ? matches.find((match) => String(match.id) === String(searchParams.matchId))
    : undefined
  const defaultGwMatch =
    selectedFromUrl ||
    [...matches]
      .filter((match) => match.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0] ||
    matches[0]
  const displayMatchday = Number(defaultGwMatch?.matchday)
  const scorerMatches = matches.filter((match) => {
    const started = ['IN_PLAY', 'PAUSED', 'FINISHED'].includes(match.status || '')
    if (!started) return false
    return Number(match.matchday) === displayMatchday || liveNow.includes(match)
  })
  const storedScorers = await loadStoredScorers(supabase, allowedMatchIds)
  const needApiScorers = scorerMatches.filter((match) => {
    if (['IN_PLAY', 'PAUSED'].includes(match.status || '')) return true
    const stored = storedScorers.get(String(match.id))
    return !stored || !(stored.home.length || stored.away.length)
  })
  const liveScorersPromise = getLiveGoalScorers(needApiScorers)

  const { data: membersRaw, error: membersError } = await supabase
    .from('contest_members')
    .select('user_id, users(username, email, quote, avatar_url)')
    .eq('contest_id', params.id)

  if (membersError || !membersRaw) {
    throw new Error(membersError?.message || 'Error loading leaderboard.')
  }
  const members = membersRaw as ContestMember[]

  const liveScorers = await liveScorersPromise
  await persistMatchScorers(
    Array.from(liveScorers.entries())
      .filter(([, item]) => item.home.length || item.away.length)
      .map(([matchId, item]) => ({
        matchId,
        home: item.home,
        away: item.away,
        elapsed: item.elapsed ?? null,
        status: scorerMatches.find((match) => String(match.id) === matchId)?.status,
      }))
  )

  // Cross-member prediction aggregation is enforced via a SECURITY DEFINER
  // Postgres RPC (get_contest_predictions) that verifies contest membership
  // server-side, rather than a service-role client bypass with an app-layer
  // fallback.
  const { data: rawPredictions, error: predictionsError } = allowedMatchIds.length
    ? await supabase.rpc('get_contest_predictions', {
        p_contest_id: params.id,
        p_match_ids: allowedMatchIds.map(id => Number(id)),
      })
    : { data: [], error: null }
  if (predictionsError) {
    throw new Error(predictionsError.message)
  }
  const predictions: Prediction[] = ((rawPredictions || []) as RpcPrediction[]).map((prediction) => ({
    user_id: prediction.user_id,
    match_id: prediction.match_id,
    predicted_home_score: prediction.predicted_home_score ?? 0,
    predicted_away_score: prediction.predicted_away_score ?? 0,
    points_earned: prediction.points ?? null,
    is_exact: prediction.is_exact,
    is_correct: prediction.is_correct,
  }))
  const matchById = new Map(matches.map(match => [String(match.id), match]))
  const memberNames = new Map(members.map((member) => [member.user_id, displayName(member)]))
  const memberByUserId = new Map(members.map((member) => [member.user_id, member]))
  const predictionsByUser = new Map<string, Prediction[]>()
  for (const prediction of predictions) {
    const list = predictionsByUser.get(prediction.user_id)
    if (list) list.push(prediction)
    else predictionsByUser.set(prediction.user_id, [prediction])
  }
  const players = members.map((member) => {
    const userPredictions = predictionsByUser.get(member.user_id) || []
    const evaluatedPredictions = userPredictions
      .map(prediction => ({
        prediction,
        match: matchById.get(String(prediction.match_id)),
      }))
      .map(item => ({
        ...item,
        points: pointsForPrediction(item.prediction, item.match, scoring)?.points ?? null,
      }))
      .filter(item => item.points !== null)
    const playedPredictions = evaluatedPredictions.filter(item => (
      ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(item.match?.status || '')
    ))
    const lockedPredictions = userPredictions.filter(prediction => {
      const match = matchById.get(String(prediction.match_id))
      return !!match && isPredictionLocked(match.utcDate)
    })
    const exactResults = playedPredictions.filter(item => item.points === ptsExact).length
    const closeResults = playedPredictions.filter(item => item.points === ptsClose).length
    const rightOutcome = playedPredictions.filter(item => item.points === ptsResult).length
    const totalPoints = playedPredictions.reduce((sum, item) => sum + (item.points || 0), 0)
    const profile = Array.isArray(member.users) ? member.users[0] : member.users
    return {
      id: member.user_id,
      username: displayName(member),
      motto: profile?.quote || '',
      avatar: profile?.avatar_url || null,
      totalPoints,
      exactResults,
      closeResults,
      rightOutcome,
      totalPlayed: lockedPredictions.length,
      scoredMatches: playedPredictions.length,
      accuracy: lockedPredictions.length ? ((exactResults + closeResults + rightOutcome) / lockedPredictions.length) * 100 : 0,
    }
  }).sort((a, b) => b.totalPoints - a.totalPoints || b.exactResults - a.exactResults || b.closeResults - a.closeResults || b.accuracy - a.accuracy || a.username.localeCompare(b.username))

  type MatchdayTotals = { points: number; exact: number; close: number; scored: number; correct: number }
  const matchdayTotals = new Map<string, Map<number, MatchdayTotals>>()
  for (const prediction of predictions) {
    const match = matchById.get(String(prediction.match_id))
    if (!match || match.status !== 'FINISHED') continue
    const result = pointsForPrediction(prediction, match, scoring)
    if (!result) continue
    const matchday = Number(match.matchday)
    let byMatchday = matchdayTotals.get(prediction.user_id)
    if (!byMatchday) {
      byMatchday = new Map()
      matchdayTotals.set(prediction.user_id, byMatchday)
    }
    const current = byMatchday.get(matchday) || { points: 0, exact: 0, close: 0, scored: 0, correct: 0 }
    current.points += result.points
    current.scored += 1
    if (result.points > 0) current.correct += 1
    if (outcomeFromPoints(result.points, scoring) === 'E') current.exact += 1
    if (outcomeFromPoints(result.points, scoring) === 'C') current.close += 1
    byMatchday.set(matchday, current)
  }
  const playedMatchdays = Array.from(new Set(matches.filter(match => match.status === 'FINISHED').map(match => Number(match.matchday)))).sort((a, b) => a - b)
  const cumulative = new Map(members.map((member) => [member.user_id, { points: 0, exact: 0, close: 0, scored: 0, correct: 0 }]))
  const evolution = playedMatchdays.map(matchday => {
    members.forEach((member) => {
      const totals = cumulative.get(member.user_id)!
      const delta = matchdayTotals.get(member.user_id)?.get(matchday)
      if (delta) {
        totals.points += delta.points
        totals.exact += delta.exact
        totals.close += delta.close
        totals.scored += delta.scored
        totals.correct += delta.correct
      }
    })
    const ranked = members.map((member) => {
      const totals = cumulative.get(member.user_id)!
      return {
        playerId: member.user_id,
        points: totals.points,
        exact: totals.exact,
        close: totals.close,
        accuracy: totals.scored ? totals.correct / totals.scored : 0,
      }
    }).sort((a, b) => b.points - a.points || b.exact - a.exact || b.close - a.close || b.accuracy - a.accuracy)
    return {
      matchday,
      standings: ranked.map(player => ({
        playerId: player.playerId,
        rank: ranked.findIndex(item => item.points === player.points && item.exact === player.exact && item.close === player.close && item.accuracy === player.accuracy) + 1,
        points: player.points,
      })),
    }
  })
  const finishedMatches = matches
    .filter((match) => match.status === 'FINISHED')
    .sort(
      (a, b) =>
        new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime() ||
        String(a.id).localeCompare(String(b.id))
    )
  const previousRankByUser = finishedMatches.length
    ? ranksFromFinishedMatches(members, finishedMatches.slice(0, -1), predictions, matchById, scoring)
    : new Map<string, number>()
  const finishedRankByUser = finishedMatches.length
    ? ranksFromFinishedMatches(members, finishedMatches, predictions, matchById, scoring)
    : new Map<string, number>()

  const plStandings = standingsData as PlStandingsData | null
  const table: PlTableRow[] =
    plStandings?.standings?.find((standing) => standing.type === 'TOTAL')?.table ||
    plStandings?.standings?.[0]?.table ||
    []
  const teamById = new Map(table.map((row) => [String(row.team?.id), row]))
  const teamByName = new Map(table.map((row) => [row.team?.name, row]))
  const teamInfo = (team: Match['homeTeam']) => {
    const row = (team.id && teamById.get(String(team.id))) || teamByName.get(team.name)
    return { name: team.name, shortName: team.shortName, crest: team.crest, rank: row?.position, form: row?.form }
  }
  const now = Date.now()
  const playersByMatch = Object.fromEntries(matches.map(match => {
    if (!isPredictionRevealable(match.utcDate, now)) {
      return [String(match.id), []]
    }
    const scoredPlayers = predictions
      .filter(prediction => String(prediction.match_id) === String(match.id))
      .map(prediction => {
        const result = pointsForPrediction(prediction, match, scoring)
        const points = result?.points ?? null
        return {
          id: prediction.user_id,
          name: memberNames.get(prediction.user_id) || 'Player',
          prediction: `${prediction.predicted_home_score} : ${prediction.predicted_away_score}`,
          points,
          outcome: (points === ptsExact ? 'exact' : points === ptsClose ? 'close' : points === ptsResult ? 'result' : 'zero') as 'zero' | 'close' | 'exact' | 'result',
          avatar: (() => {
            const member = memberByUserId.get(prediction.user_id)
            const profile = Array.isArray(member?.users) ? member.users[0] : member?.users
            return profile?.avatar_url || null
          })(),
        }
      })
      .sort((a, b) => (b.points ?? -1) - (a.points ?? -1) || a.name.localeCompare(b.name))
    return [String(match.id), scoredPlayers]
  }))
  const currentGameweekFixtures = matches.map(match => {
    const live = liveScorers.get(String(match.id))
    const stored = storedScorers.get(String(match.id))
    const fdHome = scorersForTeam(match.goals, match.homeTeam)
    const fdAway = scorersForTeam(match.goals, match.awayTeam)
    const inPlay = ['IN_PLAY', 'PAUSED'].includes(match.status || '')
    const picked =
      (live && (live.home.length || live.away.length) ? live : null) ||
      (stored && (stored.home.length || stored.away.length) ? stored : null)
    return {
      id: String(match.id),
      matchday: Number(match.matchday),
      home: match.homeTeam.shortName || match.homeTeam.name,
      away: match.awayTeam.shortName || match.awayTeam.name,
      homeCrest: match.homeTeam.crest,
      awayCrest: match.awayTeam.crest,
      kickoff: match.utcDate,
      status: match.status || '',
      isLive: inPlay,
      liveMinute: live?.elapsed ?? stored?.elapsed ?? null,
      score: match.score?.fullTime?.home !== null && match.score?.fullTime?.home !== undefined && match.score?.fullTime?.away !== null && match.score?.fullTime?.away !== undefined
        ? `${match.score.fullTime.home} : ${match.score.fullTime.away}`
        : null,
      homeScorers: picked?.home?.length || picked?.away?.length ? picked.home : fdHome,
      awayScorers: picked?.home?.length || picked?.away?.length ? picked.away : fdAway,
    }
  })
  const trends = matches.map(match => {
    const revealable = isPredictionRevealable(match.utcDate, now)
    const matchPredictions = predictions.filter(prediction => String(prediction.match_id) === String(match.id))
    const counts = { home: 0, draw: 0, away: 0 }
    const scoreCounts = new Map<string, number>()
    let homeTotal = 0
    let awayTotal = 0
    matchPredictions.forEach(prediction => {
      homeTotal += Number(prediction.predicted_home_score) || 0
      awayTotal += Number(prediction.predicted_away_score) || 0
      if (prediction.predicted_home_score > prediction.predicted_away_score) counts.home += 1
      else if (prediction.predicted_home_score < prediction.predicted_away_score) counts.away += 1
      else counts.draw += 1
      const score = `${prediction.predicted_home_score} : ${prediction.predicted_away_score}`
      scoreCounts.set(score, (scoreCounts.get(score) || 0) + 1)
    })
    const popularScore = Array.from(scoreCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    return {
      matchId: String(match.id),
      matchday: Number(match.matchday),
      kickoff: match.utcDate,
      status: match.status || '',
      actualScore: match.score?.fullTime?.home !== null && match.score?.fullTime?.home !== undefined && match.score?.fullTime?.away !== null && match.score?.fullTime?.away !== undefined
        ? `${match.score.fullTime.home} : ${match.score.fullTime.away}`
        : null,
      homeTeam: teamInfo(match.homeTeam),
      awayTeam: teamInfo(match.awayTeam),
      revealed: revealable,
      predictionCount: revealable ? matchPredictions.length : 0,
      averageHome: revealable && matchPredictions.length ? homeTotal / matchPredictions.length : null,
      averageAway: revealable && matchPredictions.length ? awayTotal / matchPredictions.length : null,
      homeWinPct: revealable && matchPredictions.length ? counts.home / matchPredictions.length * 100 : 0,
      drawPct: revealable && matchPredictions.length ? counts.draw / matchPredictions.length * 100 : 0,
      awayWinPct: revealable && matchPredictions.length ? counts.away / matchPredictions.length * 100 : 0,
      popularScore: revealable ? popularScore : null,
      predictions: revealable ? matchPredictions
        .filter(prediction => !user || prediction.user_id !== user.id)
        .map(prediction => ({
          userId: prediction.user_id,
          username: memberNames.get(prediction.user_id) || 'Player',
          homeScore: Number(prediction.predicted_home_score),
          awayScore: Number(prediction.predicted_away_score),
          points: pointsForPrediction(prediction, match, scoring)?.points ?? null,
        })) : [],
    }
  })
  const labels = {
    evolution: t('Ranking evolution'),
    evolutionTitle: t('Ranking evolution by matchday'),
    evolutionDescription: t('Follow each player’s cumulative position as results are scored.'),
    focusPlayer: t('Focus'),
    allPlayers: t('All players'),
    noEvolution: t('Ranking evolution will appear after the first completed matchday.'),
    matchday: t('Matchday'),
    leader: t('Leader'),
    player: t('Player'),
    points: t('Points'),
    rank: t('Rank'),
    predictionTrends: t('Prediction trends'),
    predictionTrendsTitle: t('What the league predicted'),
    predictionTrendsDescription: t('Anonymous crowd trends are shown once the 30-minute reveal window opens.'),
    noTrends: t('No fixtures available for this season.'),
    predictions: t('predictions'),
    hidden: t('Hidden'),
    hiddenUntilReveal: t('Predictions hidden until 30 minutes before kickoff.'),
    averageScore: t('Average score'),
    draw: t('Draw'),
    popularScore: t('Popular score'),
    form: t('Form'),
    otherPredictions: t("Other players' predictions"),
    submitted: t('submitted'),
    noPredictions: t('No predictions submitted yet.'),
    showAll: t('Show all'),
    showLess: t('Show less'),
    finalScore: t('Final score'),
  }

  type PlayerRow = (typeof players)[number] & { rank: number; previousRank: number | null; movementRank: number }

  const rankedPlayers: PlayerRow[] = players.map((player) => {
    const rank =
      players.findIndex(
        (other) =>
          other.totalPoints === player.totalPoints &&
          other.exactResults === player.exactResults &&
          other.closeResults === player.closeResults &&
          other.accuracy === player.accuracy
      ) + 1
    return {
      ...player,
      rank,
      previousRank: finishedMatches.length ? previousRankByUser.get(player.id) ?? null : null,
      movementRank: finishedRankByUser.get(player.id) ?? rank,
    }
  })

  const columns: RankColumn<PlayerRow>[] = [
    {
      key: 'rank',
      header: t('Rank'),
      headerClassName: 'text-center w-16',
      className: 'text-center',
      cell: (player) => (
        <span className="font-mono text-sm font-bold text-zinc-100">{player.rank}.</span>
      ),
    },
    {
      key: 'player',
      header: t('Player'),
      mobilePrimary: true,
      cell: (player) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <PlayerAvatar src={player.avatar} name={player.username} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-bold text-zinc-100">{player.username}</span>
              <RankMovement
                current={player.movementRank}
                previous={player.previousRank}
                upLabel={t('Rank up')}
                downLabel={t('Rank down')}
                sameLabel={t('Rank unchanged')}
              />
            </div>
            {player.motto ? (
              <div className="mt-0.5 max-w-[18ch] truncate text-xs italic text-xactscore-accent">
                &ldquo;{player.motto}&rdquo;
              </div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'points',
      header: t('Total Points'),
      headerClassName: 'text-center',
      className: 'text-center',
      cell: (player) => (
        <ScoreBadge className="text-base">
          {player.totalPoints.toFixed(1).replace('.0', '')}
        </ScoreBadge>
      ),
    },
    {
      key: 'exact',
      header: (
        <span className="inline-flex items-center gap-1">
          <Target className="h-4 w-4 text-xactscore-accent" />
          {t('Exact Score')}
        </span>
      ),
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      cell: (player) => player.exactResults,
    },
    {
      key: 'close',
      header: (
        <span className="inline-flex items-center gap-1">
          <Activity className="h-4 w-4 text-sky-400" />
          {t('Close Prediction')}
        </span>
      ),
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      cell: (player) => player.closeResults,
    },
    {
      key: 'result',
      header: (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {t('Correct Result')}
        </span>
      ),
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      cell: (player) => player.rightOutcome,
    },
  ]

  return (
    <div className="p-0">
      <LiveRefresh refreshAfter={matches.map((match) => match.utcDate)} always pingUrl="/api/scorers" />
      <PageHeader
        title={t('League table')}
        description={`${t('Tiered Scoring')}: ${t('Exact Score')} (${ptsExact}pts) • ${t('Close Prediction')} (${ptsClose}pts) • ${t('Correct Result')} (${ptsResult}pts)`}
        actions={
          <div className="flex items-center gap-1.5 text-xactscore-accent">
            <Gauge className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="flex flex-col items-end leading-none">
              <span className="text-[9px] font-black uppercase tracking-wide text-xactscore-accent/70">
                {t('Season')}
              </span>
              <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-wide sm:text-xs">
                {t(getSeasonLengthLabelKey(seasonLength))}
              </span>
            </span>
          </div>
        }
      />
      <CurrentGameweek
        fixtures={currentGameweekFixtures}
        playersByMatch={playersByMatch}
        selectedMatchId={searchParams.matchId}
      />

      <div className="mb-2 mt-6 sm:mb-4 sm:mt-8">
        <h2 className="text-base font-black uppercase tracking-wider text-zinc-100 sm:text-xl">
          {t('Contest Leaderboard')}
        </h2>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold leading-none text-zinc-500 md:hidden">
          <span className="inline-flex items-center gap-1">
            <Target className="h-3 w-3 text-xactscore-accent" aria-hidden />
            {t('Exact Score')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3 w-3 text-sky-400" aria-hidden />
            {t('Close Prediction')}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden />
            {t('Correct Result')}
          </span>
        </p>
      </div>

      <RankTable
        rows={rankedPlayers}
        columns={columns}
        getRowKey={(player) => player.id}
        emptyMessage={t('No players found in this contest.')}
        mobileSingleLine
        mobileRank={(player) => (
          <span className="text-[13px] font-bold tabular-nums text-zinc-400">{player.rank}.</span>
        )}
        mobileTitle={(player) => (
          <span className="flex min-w-0 items-center gap-1.5" title={player.motto ? `"${player.motto}"` : undefined}>
            <PlayerAvatar src={player.avatar} name={player.username} />
            <span className="min-w-0 truncate">{player.username}</span>
            <RankMovement
              current={player.movementRank}
              previous={player.previousRank}
              upLabel={t('Rank up')}
              downLabel={t('Rank down')}
              sameLabel={t('Rank unchanged')}
            />
          </span>
        )}
        mobileStats={(player) => (
          <span className="inline-flex items-center overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.05] shadow-[inset_0_1px_0_rgb(255_255_255/0.07)] backdrop-blur-md">
            <span className="inline-flex items-center divide-x divide-white/10">
              <ScoringChip
                icon={Target}
                value={player.exactResults}
                label={t('Exact Score')}
                iconClassName="text-xactscore-accent"
              />
              <ScoringChip
                icon={Activity}
                value={player.closeResults}
                label={t('Close Prediction')}
                iconClassName="text-sky-400"
              />
              <ScoringChip
                icon={CheckCircle2}
                value={player.rightOutcome}
                label={t('Correct Result')}
                iconClassName="text-emerald-400"
              />
            </span>
            <span className="ml-1 h-4 w-px shrink-0 bg-white/25" aria-hidden />
            <span
              className="inline-flex w-[4.75rem] shrink-0 items-center justify-center py-0.5 text-sm font-black tabular-nums leading-none text-xactscore-accent"
              title={t('Total Points')}
            >
              {player.totalPoints.toFixed(1).replace('.0', '')}
              <span className="ml-0.5 text-[10px] font-bold tracking-wide text-xactscore-accent/80">pts.</span>
            </span>
          </span>
        )}
      />
      <RankingInsights players={players} evolution={evolution} trends={trends} labels={labels} />
    </div>
  )
}
