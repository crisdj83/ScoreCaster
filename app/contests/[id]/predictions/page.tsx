// Fixed both imports to go up 4 folders instead of 5!
import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches } from '../../../../lib/football'
import { getMatchVenues } from '../../../../lib/goal-api'
import { isMatchInContestSeason, normalizeSeasonLength } from '../../../../lib/contest-season'
import { getActiveMatchday, isOpenForPrediction, isPredictionLocked, isPredictionRevealable } from '../../../../lib/scoring'
import PredictionCard from './PredictionCard'
import SuperLuckyButton from './SuperLuckyButton'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import LiveRefresh from '../../../components/LiveRefresh'

type PlMatch = {
  id: number | string
  utcDate: string
  status?: string
  matchday?: number | null
  homeTeam: { name: string; shortName?: string; tla?: string; crest?: string }
  awayTeam: { name: string; shortName?: string; tla?: string; crest?: string }
}

type RevealedPrediction = {
  user_id: string
  match_id: number | string
  points?: number | null
  predicted_home_score?: number | null
  predicted_away_score?: number | null
}

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
  const data = (await getPLMatches()) as { matches?: PlMatch[] }
  const seasonMatches = (data.matches || []).filter((match) => isMatchInContestSeason(match, seasonLength))
  
  // 3. Figure out which matchday is currently active.
  // Ignore stale scheduled records and use the closest genuinely upcoming fixture.
  const now = Date.now()
  const currentMatchday = getActiveMatchday(seasonMatches, now)

  const matchdayFixtures = currentMatchday
    ? seasonMatches
        .filter((m) => Number(m.matchday) === currentMatchday)
        .sort((a, b) => {
          const rank = (match: PlMatch) => {
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
  const allowedMatchIds = seasonMatches.map((match) => String(match.id))

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
  const revealedPredictions = ((revealedPredictionsRaw || []) as RevealedPrediction[]).map((prediction) => ({
    ...prediction,
    points_earned: prediction.points,
  }))

  const venues = await getMatchVenues(matchdayFixtures)
  const openThisWeek = matchdayFixtures.filter((match) => isOpenForPrediction(match, now))
  const picksLeft = openThisWeek.filter(
    (match) =>
      !myPredictions?.some(
        (prediction) =>
          String(prediction.match_id) === String(match.id) &&
          prediction.predicted_home_score !== null &&
          prediction.predicted_home_score !== undefined
      )
  ).length

  return (
    <div className="mx-auto max-w-xl p-0 sm:p-2 md:p-4">
      <LiveRefresh refreshAfter={matchdayFixtures.map((match) => match.utcDate)} />
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-zinc-100 sm:text-xl">{t('Matchday')} {currentMatchday}</h2>
            {picksLeft > 0 ? (
              <span className="rounded-full bg-xactscore-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-xactscore-bg">
                {picksLeft} {picksLeft === 1 ? t('pick left') : t('picks left')}
              </span>
            ) : openThisWeek.length > 0 ? (
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                {t('All picks in')}
              </span>
            ) : null}
          </div>
        </div>
        <SuperLuckyButton
          contestId={params.id}
          matchIds={openThisWeek.map((match) => String(match.id))}
        />
      </div>
      <p className="mb-3 text-[10px] font-medium leading-snug text-zinc-500">
        {t('Picks lock 60 minutes before kickoff.')}
      </p>

      <div className="space-y-1.5">
        {matchdayFixtures.map((match) => {
          // Find if the user already made a prediction for this specific match
        const existingPrediction = myPredictions?.find(p => String(p.match_id) === String(match.id))
          
          return (
            <PredictionCard 
              key={match.id} 
              match={match} 
              contestId={params.id} 
              existingPrediction={existingPrediction} 
              revealedPredictions={revealedPredictions?.filter((prediction) => String(prediction.match_id) === String(match.id)) || []}
              venue={venues.get(String(match.id))}
            />
          )
        })}
      </div>
    </div>
  )
}