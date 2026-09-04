'use server'

import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches } from '../../../../lib/football'
import { isMatchInContestSeason } from '../../../../lib/contest-season'
import { isPredictionLocked } from '../../../../lib/scoring'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function savePrediction(
  contestId: string,
  matchId: string,
  homeScoreRaw: number | string,
  awayScoreRaw: number | string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in to save a prediction.')

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members')
    .select('user_id, contests(season_length)')
    .eq('contest_id', contestId)
    .eq('user_id', user.id)
    .single()
  if (membershipError || !membership) throw new Error('You are not a member of this contest.')

  const matchData = await getPLMatches()
  const match = matchData.matches.find((item: { id: number | string; utcDate: string; matchday?: number }) => String(item.id) === String(matchId))
  if (!match) throw new Error('This match could not be verified. Please refresh and try again.')
  const contest = Array.isArray(membership.contests) ? membership.contests[0] : membership.contests
  if (!isMatchInContestSeason(match, contest?.season_length)) {
    throw new Error('This fixture is not part of this contest season.')
  }
  if (!match.utcDate || isPredictionLocked(match.utcDate)) {
    throw new Error('Predictions are locked one hour before kickoff.')
  }

  if (homeScoreRaw === undefined || homeScoreRaw === null || homeScoreRaw === '') {
    throw new Error('Missing Home Score. Please enter a valid number.')
  }
  if (awayScoreRaw === undefined || awayScoreRaw === null || awayScoreRaw === '') {
    throw new Error('Missing Away Score. Please enter a valid number.')
  }

  const homeScore = parseInt(String(homeScoreRaw), 10)
  const awayScore = parseInt(String(awayScoreRaw), 10)

  if (isNaN(homeScore) || isNaN(awayScore)) {
    throw new Error('Scores must be valid numbers.')
  }

  const admin = createAdminClient()
  const payload = {
    user_id: user.id,
    contest_id: contestId,
    match_id: matchId,
    predicted_home_score: homeScore,
    predicted_away_score: awayScore,
    updated_at: new Date().toISOString(),
  }
  const { error: upsertError } = await admin
    .from('predictions')
    .upsert(payload, { onConflict: 'user_id,contest_id,match_id' })

  if (upsertError) {
    const { data: existingPrediction } = await admin
      .from('predictions')
      .select('id')
      .eq('user_id', user.id)
      .eq('contest_id', contestId)
      .eq('match_id', matchId)
      .maybeSingle()

    const { error: fallbackError } = existingPrediction
      ? await admin.from('predictions').update({
          predicted_home_score: homeScore,
          predicted_away_score: awayScore,
          updated_at: payload.updated_at,
        }).eq('id', existingPrediction.id)
      : await admin.from('predictions').insert({
          user_id: user.id,
          contest_id: contestId,
          match_id: matchId,
          predicted_home_score: homeScore,
          predicted_away_score: awayScore,
        })

    if (fallbackError) {
      throw new Error(`Supabase Save Error: ${fallbackError.message}`)
    }
  }

  revalidatePath(`/contests/${contestId}/predictions`)
  revalidatePath(`/contests/${contestId}`)

  return { success: true }
}
