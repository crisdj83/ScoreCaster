// Fixed both imports to go up 4 folders instead of 5!
import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches } from '../../../../lib/football'
import PredictionCard from './PredictionCard'

export default async function PredictionsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  // 1. Get logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch the live matches from football-data.org
  const data = await getPLMatches()
  
  // 3. Figure out which matchday is currently active
  // (We look for the first match that is SCHEDULED or TIMED)
  let currentMatchday = 1;
  const upcomingMatch = data.matches.find((m: any) => m.status === 'TIMED' || m.status === 'SCHEDULED');
  if (upcomingMatch) {
    currentMatchday = upcomingMatch.matchday;
  }

  // Filter to show ONLY the matches for the current matchday
  const matchdayFixtures = data.matches.filter((m: any) => m.matchday === currentMatchday)

  // 4. Fetch the user's existing predictions from Supabase for this contest
  const { data: myPredictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('contest_id', params.id)
    .eq('user_id', user.id)

  return (
    <div className="p-6 md:p-8 bg-gray-50/50 rounded-b-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-scorecaster-text">Matchday {currentMatchday}</h2>
          <p className="text-gray-500 text-sm mt-1">Make your predictions before kickoff.</p>
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
            />
          )
        })}
      </div>
    </div>
  )
}