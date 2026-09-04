// Fixed both imports to go up 4 folders instead of 5!
import { createClient } from '../../../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getPLMatches } from '../../../../lib/football'
import { isMatchInContestSeason } from '../../../../lib/contest-season'
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
  const seasonLength = contest?.season_length === 'half' ? 'half' : 'full'

  // 2. Fetch the live matches from football-data.org and enforce the contest season.
  const data = await getPLMatches()
  const seasonMatches = data.matches.filter((match: any) => isMatchInContestSeason(match, seasonLength))
  
  // 3. Figure out which matchday is currently active
  // (We look for the first match that is SCHEDULED or TIMED)
  let currentMatchday = 1;
  const upcomingMatch = seasonMatches.find((m: any) => m.status === 'TIMED' || m.status === 'SCHEDULED');
  if (upcomingMatch) {
    currentMatchday = upcomingMatch.matchday;
  }

  // Filter to show ONLY the matches for the current matchday
  const matchdayFixtures = seasonMatches.filter((m: any) => m.matchday === currentMatchday)
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
    .filter((match: any) => Date.now() >= new Date(match.utcDate).getTime() - 30 * 60 * 1000)
    .map((match: any) => match.id)
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: revealedPredictions } = revealableMatchIds.length
    ? await serviceSupabase
      .from('predictions')
      .select('match_id, user_id, predicted_home_score, predicted_away_score, points_earned, users(username, email)')
      .eq('contest_id', params.id)
      .in('match_id', revealableMatchIds)
    : { data: [] }

  return (
    <div className="rounded-b-xl bg-[#151515] p-6 md:p-8">
      <LiveRefresh refreshAfter={matchdayFixtures.map((match: any) => match.utcDate)} />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-scorecaster-text">{t('Matchday')} {currentMatchday}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('Predictions lock one hour before kickoff. Results are revealed 30 minutes before each game.')}</p>
        </div>
      </div>
      
      {/* Grid of Fixtures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matchdayFixtures.map((match: any) => {
          // Find if the user already made a prediction for this specific match
          const existingPrediction = myPredictions?.find(p => p.match_id === match.id)
          
          return (
            <PredictionCard 
              key={match.id} 
              match={match} 
              contestId={params.id} 
              existingPrediction={existingPrediction} 
              revealedPredictions={revealedPredictions?.filter((prediction: any) => prediction.match_id === match.id) || []}
            />
          )
        })}
      </div>
    </div>
  )
}