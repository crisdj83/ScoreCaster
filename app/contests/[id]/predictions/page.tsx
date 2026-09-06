// Fixed both imports to go up 4 folders instead of 5!
import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches } from '../../../../lib/football'
import { isMatchInContestSeason, normalizeSeasonLength } from '../../../../lib/contest-season'
import { isPredictionLocked, isPredictionRevealable } from '../../../../lib/scoring'
import PredictionCard from './PredictionCard'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import LiveRefresh from '../../../components/LiveRefresh'

export default async function PredictionsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()

  // 1. Get logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: contest } = await supabase
    .from('contests')
    .select('season_length')
    .eq('id', params.id)
    .single()
  const seasonLength = normalizeSeasonLength(contest?.season_length)

  // 2. Fetch the live matches from football-data.org and enforce the contest season.
  const data = await getPLMatches()
  const seasonMatches = data.matches.filter((match: any) => isMatchInContestSeason(match, seasonLength))
  
  // 3. Figure out which matchday is currently active.
  // Ignore stale scheduled records and use the closest genuinely upcoming fixture.
  const now = Date.now();
  const liveMatch = seasonMatches.find((match: any) => (
    ['IN_PLAY', 'PAUSED'].includes(match.status)
  ));
  const upcomingMatch = seasonMatches
    .filter((m: any) => (
      ['TIMED', 'SCHEDULED'].includes(m.status) &&
      Number.isFinite(new Date(m.utcDate).getTime()) &&
      new Date(m.utcDate).getTime() > now
    ))
    .sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];
  const activeMatch = liveMatch || upcomingMatch;
  const currentMatchday = activeMatch ? Number(activeMatch.matchday) : null;

  // Current matchday, with games you can still predict always first.
  const matchdayFixtures = currentMatchday
    ? seasonMatches
        .filter((m: any) => Number(m.matchday) === currentMatchday)
        .sort((a: any, b: any) => {
          const rank = (match: any) => {
            const status = String(match.status || '')
            const kickoff = new Date(match.utcDate).getTime()
            const finished =
              ['FINISHED', 'AWARDED'].includes(status) ||
              (Number.isFinite(kickoff) && kickoff <= now - 3 * 60 * 60 * 1000)
            if (finished) return 2
            if (isPredictionLocked(match.utcDate, now)) return 1
            return 0
          }
          const rankDiff = rank(a) - rank(b)
          if (rankDiff !== 0) return rankDiff
          return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
        })
    : []
  const allowedMatchIds = seasonMatches.map((match: any) => String(match.id))

  // 4. Fetch the user's existing predictions from Supabase for this contest
  const { data: myPredictions } = allowedMatchIds.length
    ? await supabase
      .from('predictions')
      .select('id, contest_id, match_id, user_id, predicted_home_score, predicted_away_score, points, is_exact, is_correct')
      .eq('contest_id', params.id)
      .eq('user_id', user.id)
      .in('match_id', allowedMatchIds)
    : { data: [] }

  const revealableMatchIds = matchdayFixtures
    .filter((match: { utcDate: string }) => isPredictionRevealable(match.utcDate))
    .map((match: { id: number | string }) => Number(match.id))
  // Cross-member prediction aggregation is enforced via a SECURITY DEFINER
  // Postgres RPC (get_contest_predictions) that verifies contest membership
  // server-side, rather than a service-role client bypass.
  const { data: revealedPredictionsRaw, error: revealedPredictionsError } = revealableMatchIds.length
    ? await supabase.rpc('get_contest_predictions', {
        p_contest_id: params.id,
        p_match_ids: revealableMatchIds,
      })
    : { data: [], error: null }
  if (revealedPredictionsError) {
    throw new Error(`Unable to load revealed predictions: ${revealedPredictionsError.message}`)
  }
  const revealedPredictions = (revealedPredictionsRaw || []).map((prediction: any) => ({
    ...prediction,
    points_earned: prediction.points,
  }))

  return (
    <div className="p-0 sm:p-2 md:p-4">
      <LiveRefresh refreshAfter={matchdayFixtures.map((match: any) => match.utcDate)} />
      <div className="mb-2 flex items-center justify-between sm:mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-100 sm:text-2xl">{t('Matchday')} {currentMatchday}</h2>
          <p className="mt-0.5 hidden text-sm text-zinc-500 sm:block">{t('Predictions lock one hour before kickoff. Results are revealed 30 minutes before each game.')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-2 lg:gap-2">
        {matchdayFixtures.map((match: any) => {
          // Find if the user already made a prediction for this specific match
        const existingPrediction = myPredictions?.find(p => String(p.match_id) === String(match.id))
          
          return (
            <PredictionCard 
              key={match.id} 
              match={match} 
              contestId={params.id} 
              existingPrediction={existingPrediction} 
              revealedPredictions={revealedPredictions?.filter((prediction: any) => String(prediction.match_id) === String(match.id)) || []}
            />
          )
        })}
      </div>
    </div>
  )
}