import { createClient } from '../../../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { getPLMatches, getPLStandings } from '../../../../lib/football'
import { isMatchInContestSeason } from '../../../../lib/contest-season'
import { Trophy, Medal, Target, Activity, CheckCircle2, Percent, Gauge, Flame } from 'lucide-react'
import RankingInsights from './RankingInsights'
import LiveRefresh from '../../../components/LiveRefresh'

type Match = {
  id: number | string
  matchday?: number
  utcDate: string
  status?: string
  homeTeam: { id?: number | string; name: string; shortName?: string; crest?: string }
  awayTeam: { id?: number | string; name: string; shortName?: string; crest?: string }
  score?: { fullTime?: { home?: number | null; away?: number | null } }
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

function isScored(prediction: Prediction) {
  return prediction.points_earned !== null && prediction.points_earned !== undefined
}

function outcomeSymbol(prediction: Prediction, exact: number, close: number, result: number) {
  if (!isScored(prediction)) return ''
  if (prediction.is_exact || Number(prediction.points_earned) === exact) return 'E'
  if (prediction.is_correct === false) return '0'
  if (Number(prediction.points_earned) === close) return 'C'
  if (prediction.is_correct || Number(prediction.points_earned) === result) return 'R'
  return Number(prediction.points_earned) > 0 ? 'R' : '0'
}

function displayName(member: any) {
  const user = Array.isArray(member.users) ? member.users[0] : member.users
  return user?.username || user?.email?.split('@')[0] || 'Unknown Player'
}

export default async function RankingPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contest } = await supabase
    .from('contests')
    .select('points_exact, points_close, points_result, season_length')
    .eq('id', params.id)
    .single()

  if (!contest) return <div className="p-6 text-sm text-red-600">Error loading contest data.</div>

  const ptsExact = Number(contest.points_exact) || 3
  const ptsClose = Number(contest.points_close) || 1.5
  const ptsResult = Number(contest.points_result) || 1
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
    .select('user_id, users(username, email, quote)')
    .eq('contest_id', params.id)

  if (membersError || !members) return <div className="p-6 text-sm text-red-600">Error loading leaderboard.</div>

  // Use the service client for the same reveal-safe source used by the match page.
  // Scores are only sent to the client for fixtures that have reached the reveal window.
  const db = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : supabase
  const { data: rawPredictions } = allowedMatchIds.length
    ? await db
      .from('predictions')
      .select('user_id, match_id, predicted_home_score, predicted_away_score, points_earned, is_exact, is_correct')
      .eq('contest_id', params.id)
      .in('match_id', allowedMatchIds)
    : { data: [] }
  const predictions: Prediction[] = (rawPredictions || []) as Prediction[]
  const memberNames = new Map(members.map((member: any) => [member.user_id, displayName(member)]))
  const predictionFor = (userId: string, matchId: string) => predictions.find(prediction => prediction.user_id === userId && String(prediction.match_id) === matchId)
  const finishedMatchIds = new Set(matches.filter(match => match.status === 'FINISHED').map(match => String(match.id)))

  const players = members.map((member: any) => {
    const userPredictions = predictions.filter(prediction => prediction.user_id === member.user_id)
    const scored = userPredictions.filter(isScored)
    const exactResults = scored.filter(prediction => outcomeSymbol(prediction, ptsExact, ptsClose, ptsResult) === 'E').length
    const closeResults = scored.filter(prediction => outcomeSymbol(prediction, ptsExact, ptsClose, ptsResult) === 'C').length
    const rightOutcome = scored.filter(prediction => outcomeSymbol(prediction, ptsExact, ptsClose, ptsResult) === 'R').length
    const totalPoints = scored.reduce((sum, prediction) => sum + (Number(prediction.points_earned) || 0), 0)
    const recentForm = matches
      .filter(match => finishedMatchIds.has(String(match.id)))
      .map(match => predictionFor(member.user_id, String(match.id)))
      .filter((prediction): prediction is Prediction => !!prediction && isScored(prediction))
      .map(prediction => outcomeSymbol(prediction, ptsExact, ptsClose, ptsResult))
      .slice(-5)
    let currentStreak = 0
    for (let index = scored.length - 1; index >= 0; index -= 1) {
      if ((Number(scored[index].points_earned) || 0) > 0) currentStreak += 1
      else break
    }
    return {
      id: member.user_id,
      username: displayName(member),
      motto: (Array.isArray(member.users) ? member.users[0]?.quote : member.users?.quote) || '',
      totalPoints,
      exactResults,
      closeResults,
      rightOutcome,
      totalPlayed: userPredictions.length,
      scoredMatches: scored.length,
      accuracy: scored.length ? ((exactResults + closeResults + rightOutcome) / scored.length) * 100 : 0,
      averagePoints: scored.length ? totalPoints / scored.length : 0,
      currentStreak,
      recentForm,
    }
  }).sort((a, b) => b.totalPoints - a.totalPoints || b.exactResults - a.exactResults || b.closeResults - a.closeResults || b.accuracy - a.accuracy || a.username.localeCompare(b.username))

  const rankFor = (userId: string, matchday: number) => {
    const totals = members.map((member: any) => {
      const memberPredictions = predictions.filter(prediction => prediction.user_id === member.user_id && isScored(prediction)).filter(prediction => {
        const match = matches.find(item => String(item.id) === String(prediction.match_id))
        return Number(match?.matchday) <= matchday
      })
      return {
        playerId: member.user_id,
        points: memberPredictions.reduce((sum, prediction) => sum + (Number(prediction.points_earned) || 0), 0),
        exact: memberPredictions.filter(prediction => outcomeSymbol(prediction, ptsExact, ptsClose, ptsResult) === 'E').length,
        close: memberPredictions.filter(prediction => outcomeSymbol(prediction, ptsExact, ptsClose, ptsResult) === 'C').length,
        accuracy: memberPredictions.length
          ? memberPredictions.filter(prediction => (Number(prediction.points_earned) || 0) > 0).length / memberPredictions.length
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
    return { name: team.name, shortName: team.shortName, crest: team.crest, rank: row?.position, form: row?.form }
  }
  const now = Date.now()
  const trends = matches.map(match => {
    const revealable = now >= new Date(match.utcDate).getTime() - 30 * 60 * 1000
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
          points: isScored(prediction) ? Number(prediction.points_earned) : null,
        })) : [],
    }
  })
  const teamStats = table.map((row: any) => ({
    id: String(row.team?.id),
    name: row.team?.name || 'Unknown team',
    crest: row.team?.crest,
    position: row.position,
    playedGames: row.playedGames,
    points: row.points,
    goalDifference: row.goalDifference,
    form: row.form,
  }))
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
    teamStats: t('Team form & ranking'),
    noTeamStats: t('Team standings are currently unavailable.'),
    team: t('Team'),
    played: t('Played'),
    goalDifference: t('Goal difference'),
    form: t('Form'),
    finalScore: t('Final score'),
    teamStatsDescription: t('Live Premier League rank and recent form powered by football-data.org.'),
  }

  return (
    <div className="p-0">
      <LiveRefresh refreshAfter={matches.map(match => match.utcDate)} />
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-orange-600">
          <Gauge className="h-5 w-5" />
          <span className="text-xs font-black uppercase tracking-widest">{t('Season')}: {seasonLength === 'half' ? t('Half season') : t('Full season')}</span>
        </div>
        <h2 className="text-2xl font-bold text-scorecaster-text">{t('Contest Leaderboard')}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {t('Tiered Scoring')}: {t('Exact Score')} ({ptsExact}pts) • {t('Close Prediction')} ({ptsClose}pts) • {t('Correct Result')} ({ptsResult}pts)
        </p>
      </div>

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
              <th className="px-4 py-4 text-center"><Percent className="mr-1 inline h-4 w-4 text-orange-400" />{t('Accuracy')}</th>
              <th className="px-4 py-4 text-center">{t('Average points')}</th>
              <th className="px-4 py-4 text-center"><Flame className="mr-1 inline h-4 w-4 text-orange-400" />{t('Streak')}</th>
              <th className="px-4 py-4">{t('Recent form')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.length === 0 ? (
              <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-500">{t('No players found in this contest.')}</td></tr>
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
                    <div className="mt-0.5 text-xs text-gray-500">{player.totalPlayed} {t('matches played')} · {player.scoredMatches} {t('scored')}</div>
                  </td>
                  <td className="bg-orange-50/50 px-4 py-4 text-center text-xl font-black text-orange-600">{player.totalPoints.toFixed(1).replace('.0', '')}</td>
                  <td className="px-4 py-4 text-center font-bold text-gray-700">{player.exactResults}</td>
                  <td className="px-4 py-4 text-center font-bold text-gray-700">{player.closeResults}</td>
                  <td className="px-4 py-4 text-center font-bold text-gray-700">{player.rightOutcome}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`rounded-full px-2 py-1 font-black ${player.accuracy >= 70 ? 'bg-emerald-100 text-emerald-700' : player.accuracy >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{Math.round(player.accuracy)}%</span>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-gray-700">{player.averagePoints.toFixed(1)}</td>
                  <td className="px-4 py-4 text-center font-black text-orange-600">{player.currentStreak}</td>
                  <td className="px-4 py-4"><div className="flex gap-1">{player.recentForm.length ? player.recentForm.map((result, formIndex) => <span key={`${player.id}-${formIndex}`} className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-black text-white ${result === 'E' ? 'bg-[#84a900]' : result === 'C' ? 'bg-blue-500' : result === 'R' ? 'bg-emerald-500' : 'bg-red-500'}`}>{result}</span>) : <span className="text-xs text-gray-400">—</span>}</div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <RankingInsights players={players} evolution={evolution} trends={trends} teamStats={teamStats} labels={labels} />
    </div>
  )
}
