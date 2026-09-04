import { createClient } from '../../../../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getPLMatches } from '../../../../../lib/football'
import { isMatchInContestSeason } from '../../../../../lib/contest-season'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Eye, Lock, Trophy } from 'lucide-react'
import { getTranslations } from '../../../../../lib/i18n'
import { getServerLocale } from '../../../../../lib/i18n-server'

type PageProps = { params: Promise<{ id: string; matchId: string }> }

export default async function MatchPredictionsPage({ params }: PageProps) {
  const { id, matchId } = await params
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('contest_members')
    .select('user_id, contests(season_length)')
    .eq('contest_id', id)
    .eq('user_id', user.id)
    .single()
  if (!membership) redirect(`/contests/${id}/predictions?error=You do not have access to this contest.`)

  const data = await getPLMatches()
  const match = data.matches.find((item: { id: number | string }) => String(item.id) === matchId)
  if (!match) redirect(`/contests/${id}/predictions?error=Match not found.`)
  const contest = Array.isArray(membership.contests) ? membership.contests[0] : membership.contests
  if (!isMatchInContestSeason(match, contest?.season_length)) {
    redirect(`/contests/${id}/predictions?error=This fixture is not part of this contest season.`)
  }

  const kickoff = new Date(match.utcDate).getTime()
  const canReveal = Date.now() >= kickoff - 30 * 60 * 1000
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: members } = await db
    .from('contest_members')
    .select('user_id, users(username, email)')
    .eq('contest_id', id)
  const { data: predictions } = canReveal
    ? await db.from('predictions')
      .select('user_id, predicted_home_score, predicted_away_score, points_earned')
      .eq('contest_id', id)
      .eq('match_id', matchId)
    : { data: [] }

  const predictionByUser = new Map((predictions || []).map(prediction => [prediction.user_id, prediction]))
  const players = (members || []).map(member => {
    const player = Array.isArray(member.users) ? member.users[0] : member.users
    const prediction = predictionByUser.get(member.user_id)
    return {
      id: member.user_id,
      name: player?.username || player?.email?.split('@')[0] || 'Player',
      homeScore: prediction?.predicted_home_score,
      awayScore: prediction?.predicted_away_score,
      points: prediction?.points_earned,
    }
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <Link href={`/contests/${id}/predictions`} className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> {t('Back to fixtures')}
      </Link>
      <div className="rounded-2xl bg-gray-950 p-6 text-white shadow-xl md:p-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#d4ff00]">
          <Trophy className="h-4 w-4" /> {t('Match predictions')}
        </div>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight">
          {match.homeTeam.name} <span className="text-[#d4ff00]">vs</span> {match.awayTeam.name}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-gray-300">
          <Clock className="h-4 w-4" /> {new Date(match.utcDate).toLocaleString(getServerLocale())}
        </p>
      </div>
      <div className={`rounded-2xl border p-5 ${canReveal ? 'border-emerald-400/40 bg-emerald-950/50' : 'border-gray-400/30 bg-[#1b1b1b]'}`}>
        <div className="flex items-center gap-3">
          {canReveal ? <Eye className="h-5 w-5 text-emerald-300" /> : <Lock className="h-5 w-5 text-gray-300" />}
          <div>
            <p className="font-black uppercase tracking-tight text-gray-100">
              {canReveal ? t('Predictions are now visible') : t('Predictions are hidden')}
            </p>
            <p className="text-sm text-gray-300">
              {canReveal ? t('Everyone’s submitted score is shown below.') : t('Scores unlock 30 minutes before kickoff.')}
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-[#242424] shadow-lg">
        <div className="grid grid-cols-[1fr_auto] border-b border-gray-100 bg-[#1b1b1b] px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-300">
          <span>{t('Player')}</span><span>{t('Score / Points')}</span>
        </div>
        {players.length ? players.map(player => (
         <div key={player.id} className="grid grid-cols-[1fr_auto] items-center border-b border-white/10 px-5 py-4 last:border-0">
            <span className="font-bold text-gray-100">{player.name}</span>
            <span className={`flex items-center gap-3 font-mono text-lg font-black ${canReveal ? 'text-orange-100' : 'text-gray-300'}`}>
              {canReveal && player.homeScore !== undefined ? `${player.homeScore} : ${player.awayScore}` : '— : —'}
              {match.status === 'FINISHED' && player.points !== null && player.points !== undefined && (
                <span className="rounded-full bg-[#d4ff00] px-2 py-1 font-sans text-xs text-black">+{player.points} pts</span>
              )}
            </span>
          </div>
        )) : (
          <p className="p-8 text-center text-sm text-gray-400">{t('No players are in this contest yet.')}</p>
        )}
      </div>
    </div>
  )
}
