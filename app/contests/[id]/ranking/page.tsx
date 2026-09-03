import { createClient } from '../../../../lib/supabase/server'
import { Trophy, Medal, Target, Activity, CheckCircle2 } from 'lucide-react'

export default async function RankingPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  // 1. Fetch the custom scoring rules for this specific contest
  const { data: contest } = await supabase
    .from('contests')
    .select('points_exact, points_close, points_result')
    .eq('id', params.id)
    .single()

  if (!contest) return <div>Error loading contest data.</div>

  // Set fallbacks just in case
  const ptsExact = Number(contest.points_exact) || 3
  const ptsClose = Number(contest.points_close) || 1.5
  const ptsResult = Number(contest.points_result) || 1

  // 2. Fetch all members
  const { data: members, error: membersError } = await supabase
    .from('contest_members')
    .select(`
      user_id,
      users (username, email)
    `)
    .eq('contest_id', params.id)

  if (membersError || !members) return <div>Error loading leaderboard.</div>

  // 3. Fetch all predictions
  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, points_earned')
    .eq('contest_id', params.id)

  // 4. Aggregate stats dynamically using the custom contest rules
  const leaderboard = members.map((member: any) => {
    const userPredictions = predictions?.filter(p => p.user_id === member.user_id) || []
    
    // Sum up total points
    const totalPoints = userPredictions.reduce((sum, p) => sum + (Number(p.points_earned) || 0), 0)
    
    // Dynamically check against the custom points!
    const exactResults = userPredictions.filter(p => Number(p.points_earned) === ptsExact).length
    const closeResults = userPredictions.filter(p => Number(p.points_earned) === ptsClose).length
    const rightOutcome = userPredictions.filter(p => Number(p.points_earned) === ptsResult).length
    
    const totalPlayed = userPredictions.length

    return {
      id: member.user_id,
      username: member.users?.username || member.users?.email?.split('@')[0] || 'Unknown Player',
      totalPoints,
      exactResults,
      closeResults,
      rightOutcome,
      totalPlayed,
    }
  })

  // 5. Sort by highest points first
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints)

  return (
    <div className="p-6 md:p-8 bg-gray-50/50 rounded-b-xl overflow-x-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-scorecaster-text">Contest Leaderboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          Tiered Scoring: Exact ({ptsExact}pts) • Close ({ptsClose}pts) • Result ({ptsResult}pts)
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-w-[900px]">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4 text-center w-16">Rank</th>
              <th className="px-6 py-4">Player</th>
              <th className="px-6 py-4 text-center font-bold text-scorecaster-text border-r border-gray-100">Total Points</th>
              <th className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-4 w-4 text-scorecaster-green" /> Exact ({ptsExact}pts)
                </div>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Activity className="h-4 w-4 text-blue-500" /> Close ({ptsClose}pts)
                </div>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" /> Result ({ptsResult}pts)
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No players found in this contest.
                </td>
              </tr>
            ) : (
              leaderboard.map((player, index) => {
                const rank = index + 1;
                return (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-gray-900 text-lg">
                      {rank === 1 ? <Trophy className="h-6 w-6 text-yellow-400 mx-auto" /> : 
                       rank === 2 ? <Medal className="h-6 w-6 text-gray-400 mx-auto" /> : 
                       rank === 3 ? <Medal className="h-6 w-6 text-amber-600 mx-auto" /> : 
                       rank}
                    </td>
                    <td className="px-6 py-4 font-semibold text-scorecaster-text text-base">
                      {player.username}
                      <div className="text-xs text-gray-400 font-normal mt-0.5">{player.totalPlayed} matches played</div>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-scorecaster-green text-xl border-r border-gray-100 bg-green-50/30">
                      {player.totalPoints}
                    </td>
                    
                    <td className="px-6 py-4 text-center font-medium text-gray-700">
                      {player.exactResults}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-700">
                      {player.closeResults}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-700">
                      {player.rightOutcome}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}