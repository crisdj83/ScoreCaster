// Fixed both imports to go up 4 folders instead of 5!
import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches } from '../../../../lib/football'
import { isMatchInContestSeason, normalizeSeasonLength } from '../../../../lib/contest-season'
import { isPredictionRevealable } from '../../../../lib/scoring'
import { createAdminClient } from '../../../../lib/supabase/admin'
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

  // Filter to show ONLY the matches for the current matchday
  const matchdayFixtures = currentMatchday
    ? seasonMatches.filter((m: any) => Number(m.matchday) === currentMatchday)
    : []
  const allowedMatchIds = seasonMatches.map((match: any) => String(match.id))

  // 4. Fetch the user's existing predictions from Supabase for this contest
  const { data: myPredictions } = allowedMatchIds.length
    ? await supabase
      .from('predictions')
      .select('*')
      .eq('contest_id', params.id)
      .eq('user_id', user.id)
      .in('match_id', allowedMatchIds)
    : { data: [] }

  const revealableMatchIds = matchdayFixtures
    .filter((match: { utcDate: string }) => isPredictionRevealable(match.utcDate))
    .map((match: { id: number | string }) => String(match.id))
  const serviceSupabase = createAdminClient()
  const { data: revealedPredictionsRaw, error: revealedPredictionsError } = revealableMatchIds.length
    ? await serviceSupabase
      .from('predictions')
      .select('match_id, user_id, predicted_home_score, predicted_away_score, points, users(username, email)')
      .eq('contest_id', params.id)
      .in('match_id', revealableMatchIds)
    : { data: [] }
  if (revealedPredictionsError) {
    throw new Error(`Unable to load revealed predictions: ${revealedPredictionsError.message}`)
  }
  const revealedPredictions = (revealedPredictionsRaw || []).map((prediction: any) => ({
    ...prediction,
    points_earned: prediction.points,
  }))

  return (
    <div className="rounded-b-xl bg-zinc-950 p-6 md:p-8">
      <LiveRefresh refreshAfter={matchdayFixtures.map((match: any) => match.utcDate)} />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">{t('Matchday')} {currentMatchday}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t('Predictions lock one hour before kickoff. Results are revealed 30 minutes before each game.')}</p>
        </div>
      </div>
      
      {/* Grid of Fixtures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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