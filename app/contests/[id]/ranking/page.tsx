import { createClient } from '../../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { getPLMatches, getPLStandings } from '../../../../lib/football'
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
import { Target, Activity, CheckCircle2, Gauge } from 'lucide-react'
import RankingInsights from './RankingInsights'
import CurrentGameweek from './CurrentGameweek'
import LiveRefresh from '../../../components/LiveRefresh'
import { RankTable, type RankColumn } from '@/components/ui/rank-table'
import { ScoreBadge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'

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

function displayName(member: any) {
  const user = Array.isArray(member.users) ? member.users[0] : member.users
  return user?.username || user?.email?.split('@')[0] || 'Unknown Player'
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

  const { data: members, error: membersError } = await supabase
    .from('contest_members')
    .select('user_id, users(username, email, quote, avatar_url)')
    .eq('contest_id', params.id)

  if (membersError || !members) {
    throw new Error(membersError?.message || 'Error loading leaderboard.')
  }

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
  const predictions: Prediction[] = (rawPredictions || []).map((prediction: any) => ({
    ...prediction,
    points_earned: prediction.points,
  })) as Prediction[]
  const matchById = new Map(matches.map(match => [String(match.id), match]))
  const memberNames = new Map(members.map((member: any) => [member.user_id, displayName(member)]))
  const memberByUserId = new Map(members.map((member: any) => [member.user_id, member]))
  const predictionsByUser = new Map<string, Prediction[]>()
  for (const prediction of predictions) {
    const list = predictionsByUser.get(prediction.user_id)
    if (list) list.push(prediction)
    else predictionsByUser.set(prediction.user_id, [prediction])
  }
  const players = members.map((member: any) => {
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
    return {
      id: member.user_id,
      username: displayName(member),
      motto: (Array.isArray(member.users) ? member.users[0]?.quote : member.users?.quote) || '',
      totalPoints,
      exactResults,
      closeResults,
      rightOutcome,
      totalPlayed: lockedPredictions.length,
      scoredMatches: playedPredictions.length,
      accuracy: lockedPredictions.length ? ((exactResults + closeResults + rightOutcome) / lockedPredictions.length) * 100 : 0,
      averagePoints: playedPredictions.length ? playedPredictions.reduce((sum, item) => sum + (item.points || 0), 0) / playedPredictions.length : 0,
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
  const cumulative = new Map(members.map((member: any) => [member.user_id, { points: 0, exact: 0, close: 0, scored: 0, correct: 0 }]))
  const evolution = playedMatchdays.map(matchday => {
    members.forEach((member: any) => {
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
    const ranked = members.map((member: any) => {
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

  const table: any[] = standingsData?.standings?.find((standing: any) => standing.type === 'TOTAL')?.table || standingsData?.standings?.[0]?.table || []
  const teamById = new Map(table.map((row: any) => [String(row.team?.id), row]))
  const teamByName = new Map(table.map((row: any) => [row.team?.name, row]))
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
  const currentGameweekFixtures = matches.map(match => ({
    id: String(match.id),
    matchday: Number(match.matchday),
    home: match.homeTeam.shortName || match.homeTeam.name,
    away: match.awayTeam.shortName || match.awayTeam.name,
    homeCrest: match.homeTeam.crest,
    awayCrest: match.awayTeam.crest,
    kickoff: match.utcDate,
    status: match.status || '',
    isLive: ['IN_PLAY', 'PAUSED'].includes(match.status || ''),
    score: match.score?.fullTime?.home !== null && match.score?.fullTime?.home !== undefined && match.score?.fullTime?.away !== null && match.score?.fullTime?.away !== undefined
      ? `${match.score.fullTime.home} : ${match.score.fullTime.away}`
      : null,
  }))
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

  type PlayerRow = (typeof players)[number] & { rank: number }

  const rankedPlayers: PlayerRow[] = players.map((player) => ({
    ...player,
    rank:
      players.findIndex(
        (other) =>
          other.totalPoints === player.totalPoints &&
          other.exactResults === player.exactResults &&
          other.closeResults === player.closeResults &&
          other.accuracy === player.accuracy
      ) + 1,
  }))

  const columns: RankColumn<PlayerRow>[] = [
    {
      key: 'rank',
      header: t('Rank'),
      headerClassName: 'text-center w-16',
      className: 'text-center',
      cell: (player) => (
        <span className="font-mono text-sm font-bold text-zinc-100">{player.rank}</span>
      ),
    },
    {
      key: 'player',
      header: t('Player'),
      mobilePrimary: true,
      cell: (player) => (
        <div>
          <div className="font-bold text-zinc-100">{player.username}</div>
          {player.motto ? (
            <div className="mt-0.5 max-w-[18ch] truncate text-xs italic text-scorecaster-accent">
              &ldquo;{player.motto}&rdquo;
            </div>
          ) : null}
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
          <Target className="h-4 w-4 text-scorecaster-accent" />
          {t('Exact Score')}
        </span>
      ),
      mobileHeader: t('Exact Score'),
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      mobileExpandable: true,
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
      mobileHeader: t('Close Prediction'),
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      mobileExpandable: true,
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
      mobileHeader: t('Correct Result'),
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      mobileExpandable: true,
      cell: (player) => player.rightOutcome,
    },
    {
      key: 'avg',
      header: t('Average points'),
      mobileHeader: t('Average points'),
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      mobileExpandable: true,
      cell: (player) => player.averagePoints.toFixed(1),
    },
  ]

  return (
    <div className="p-0">
      <LiveRefresh refreshAfter={matches.map((match) => match.utcDate)} always />
      <PageHeader
        title={t('League Ranking')}
        description={`${t('Tiered Scoring')}: ${t('Exact Score')} (${ptsExact}pts) • ${t('Close Prediction')} (${ptsClose}pts) • ${t('Correct Result')} (${ptsResult}pts)`}
        actions={
          <div className="flex items-center gap-2 text-scorecaster-accent">
            <Gauge className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">
              {t('Season')}: {t(getSeasonLengthLabelKey(seasonLength))}
            </span>
          </div>
        }
      />
      <CurrentGameweek
        fixtures={currentGameweekFixtures}
        playersByMatch={playersByMatch}
        selectedMatchId={searchParams.matchId}
      />

      <div className="mb-3 mt-6 flex items-center justify-between sm:mb-4 sm:mt-8">
        <h2 className="text-base font-black uppercase tracking-wider text-zinc-100 sm:text-xl">
          {t('Contest Leaderboard')}
        </h2>
      </div>

      <RankTable
        rows={rankedPlayers}
        columns={columns}
        getRowKey={(player) => player.id}
        emptyMessage={t('No players found in this contest.')}
        mobileSingleLine
        mobileRank={(player) => (
          <span className="text-[13px] font-bold tabular-nums text-zinc-400">{player.rank}</span>
        )}
        mobileTitle={(player) => player.username}
        mobileSubtitle={(player) => (player.motto ? `"${player.motto}"` : undefined)}
        mobileEnd={(player) => (
          <span className="text-sm">{player.totalPoints.toFixed(1).replace('.0', '')}</span>
        )}
      />
      <RankingInsights players={players} evolution={evolution} trends={trends} labels={labels} />
    </div>
  )
}
