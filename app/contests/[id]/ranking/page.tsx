import { createClient } from '../../../../lib/supabase/server'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { getPLMatches, getPLStandings } from '../../../../lib/football'
import { isMatchInContestSeason } from '../../../../lib/contest-season'
import {
  calculatePoints,
  getOfficialScore,
  isPredictionLocked,
  isPredictionRevealable,
  resolveContestScoring,
  type ContestScoring,
} from '../../../../lib/scoring'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { Trophy, Medal, Target, Activity, CheckCircle2, Gauge } from 'lucide-react'
import RankingInsights from './RankingInsights'
import CurrentGameweek from './CurrentGameweek'
import LiveRefresh from '../../../components/LiveRefresh'

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

  if (!contest) return <div className="p-6 text-sm text-red-600">Error loading contest data.</div>

  const scoring = resolveContestScoring(contest)
  const ptsExact = scoring.exact
  const ptsClose = scoring.close
  const ptsResult = scoring.result
  const seasonLength = contest.season_length === 'half' ? 'half' : 'full'
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

  if (membersError || !members) return <div className="p-6 text-sm text-red-600">Error loading leaderboard.</div>

  let db = supabase
  try {
    db = createAdminClient()
  } catch {
    db = supabase
  }
  const { data: rawPredictions } = allowedMatchIds.length
    ? await db
      .from('predictions')
      .select('user_id, match_id, predicted_home_score, predicted_away_score, points, is_exact, is_correct')
      .eq('contest_id', params.id)
      .in('match_id', allowedMatchIds)
    : { data: [] }
  const predictions: Prediction[] = (rawPredictions || []).map((prediction: any) => ({
    ...prediction,
    points_earned: prediction.points,
  })) as Prediction[]
  const memberNames = new Map(members.map((member: any) => [member.user_id, displayName(member)]))
  const predictionFor = (userId: string, matchId: string) => predictions.find(prediction => prediction.user_id === userId && String(prediction.match_id) === matchId)
  const players = members.map((member: any) => {
    const userPredictions = predictions.filter(prediction => prediction.user_id === member.user_id)
    const evaluatedPredictions = userPredictions
      .map(prediction => ({
        prediction,
        match: matches.find(match => String(match.id) === String(prediction.match_id)),
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
      const match = matches.find(item => String(item.id) === String(prediction.match_id))
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

  const rankFor = (userId: string, matchday: number) => {
    const totals = members.map((member: any) => {
      const memberResults = predictions
        .filter(prediction => prediction.user_id === member.user_id)
        .map(prediction => {
          const match = matches.find(item => String(item.id) === String(prediction.match_id))
          if (!match || match.status !== 'FINISHED' || Number(match.matchday) > matchday) return null
          return pointsForPrediction(prediction, match, scoring)
        })
        .filter((result): result is NonNullable<typeof result> => result !== null)
      return {
        playerId: member.user_id,
        points: memberResults.reduce((sum, result) => sum + result.points, 0),
        exact: memberResults.filter(result => outcomeFromPoints(result.points, scoring) === 'E').length,
        close: memberResults.filter(result => outcomeFromPoints(result.points, scoring) === 'C').length,
        accuracy: memberResults.length
          ? memberResults.filter(result => result.points > 0).length / memberResults.length
          : 0,
      }
    }).sort((a, b) => b.points - a.points || b.exact - a.exact || b.close - a.close || b.accuracy - a.accuracy)
    const player = totals.find(item => item.playerId === userId)
    return {
      rank: player
        ? totals.findIndex(item => item.points === player.points && item.exact === player.exact && item.close === player.close && item.accuracy === player.accuracy) + 1
        : totals.length,
      points: player?.points || 0,
    }
  }
  const playedMatchdays = Array.from(new Set(matches.filter(match => match.status === 'FINISHED').map(match => Number(match.matchday)))).sort((a, b) => a - b)
  const evolution = playedMatchdays.map(matchday => ({
    matchday,
    standings: members.map((member: any) => ({ playerId: member.user_id, ...rankFor(member.user_id, matchday) })),
  }))

  const table: any[] = standingsData?.standings?.find((standing: any) => standing.type === 'TOTAL')?.table || standingsData?.standings?.[0]?.table || []
  const teamById = new Map(table.map((row: any) => [String(row.team?.id), row]))
  const teamByName = new Map(table.map((row: any) => [row.team?.name, row]))
  const teamInfo = (team: Match['homeTeam']) => {
    const row = (team.id && teamById.get(String(team.id))) || teamByName.get(team.name)
    return { name: team.name, shortName: team.shortName, crest: team.crest, rank: row?.position }
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
            const member = members.find((item: any) => item.user_id === prediction.user_id)
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
    otherPredictions: t("Other players' predictions"),
    submitted: t('submitted'),
    noPredictions: t('No predictions submitted yet.'),
    showAll: t('Show all'),
    showLess: t('Show less'),
    finalScore: t('Final score'),
  }

  return (
    <div className="p-0">
      <LiveRefresh refreshAfter={matches.map(match => match.utcDate)} always />
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-orange-600">
          <Gauge className="h-5 w-5" />
          <span className="text-xs font-black uppercase tracking-widest">{t('Season')}: {seasonLength === 'half' ? t('Half season') : t('Full season')}</span>
        </div>
        <h2 className="text-2xl font-bold text-scorecaster-text">PL RANKING</h2>
        <p className="mt-1 text-sm text-gray-500">
          {t('Tiered Scoring')}: {t('Exact Score')} ({ptsExact}pts) • {t('Close Prediction')} ({ptsClose}pts) • {t('Correct Result')} ({ptsResult}pts)
        </p>
      </div>
      <CurrentGameweek
        fixtures={currentGameweekFixtures}
        playersByMatch={playersByMatch}
        selectedMatchId={searchParams.matchId}
      />

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
        <table className="w-full min-w-[1080px] text-sm text-left">
          <thead className="bg-gray-950 text-xs font-semibold uppercase tracking-wider text-gray-300">
            <tr>
              <th className="px-4 py-4 text-center w-16">{t('Rank')}</th>
              <th className="px-4 py-4">{t('Player')}</th>
              <th className="px-4 py-4 text-center">{t('Total Points')}</th>
              <th className="px-4 py-4 text-center"><Target className="mr-1 inline h-4 w-4 text-[#d4ff00]" />{t('Exact Score')}</th>
              <th className="px-4 py-4 text-center"><Activity className="mr-1 inline h-4 w-4 text-blue-400" />{t('Close Prediction')}</th>
              <th className="px-4 py-4 text-center"><CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-400" />{t('Correct Result')}</th>
              <th className="px-4 py-4 text-center">{t('Average points')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">{t('No players found in this contest.')}</td></tr>
            ) : players.map((player, index) => {
              const tiedRank = players.findIndex(other => other.totalPoints === player.totalPoints && other.exactResults === player.exactResults && other.closeResults === player.closeResults && other.accuracy === player.accuracy) + 1
              return (
                <tr key={player.id} className="transition-colors hover:bg-orange-50/50">
                  <td className="px-4 py-4 text-center font-bold text-gray-900">
                    <div className="flex items-center justify-center gap-2">
                      {tiedRank === 1 ? <Trophy className="h-6 w-6 text-yellow-500" /> : tiedRank === 2 ? <Medal className="h-6 w-6 text-gray-400" /> : tiedRank === 3 ? <Medal className="h-6 w-6 text-amber-600" /> : <span className="h-6 w-6" />}
                      <span>{tiedRank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-gray-900">{player.username}</div>
                    {player.motto && <div className="mt-0.5 max-w-[18ch] truncate text-xs italic text-orange-500">&ldquo;{player.motto}&rdquo;</div>}
                  </td>
                  <td className="px-4 py-4 text-center text-xl font-black text-orange-600">{player.totalPoints.toFixed(1).replace('.0', '')}</td>
                  <td className="px-4 py-4 text-center font-bold text-gray-700">{player.exactResults}</td>
                  <td className="px-4 py-4 text-center font-bold text-gray-700">{player.closeResults}</td>
                  <td className="px-4 py-4 text-center font-bold text-gray-700">{player.rightOutcome}</td>
                  <td className="px-4 py-4 text-center font-bold text-gray-700">{player.averagePoints.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <RankingInsights players={players} evolution={evolution} trends={trends} labels={labels} />
    </div>
  )
}
