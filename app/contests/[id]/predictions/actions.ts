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
  if (homeScore < 0 || homeScore > 5 || awayScore < 0 || awayScore > 5) {
    throw new Error('Scores must be between 0 and 5.')
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

export async function saveGameweekPredictions(
  contestId: string,
  predictions: { matchId: string; homeScore: number; awayScore: number }[]
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

  const contest = Array.isArray(membership.contests) ? membership.contests[0] : membership.contests
  const matchData = await getPLMatches()
  const now = Date.now()
  const updatedAt = new Date().toISOString()
  const payloads = []

  for (const prediction of predictions) {
    const match = matchData.matches.find(
      (item: { id: number | string; utcDate: string }) => String(item.id) === String(prediction.matchId)
    )
    if (!match) continue
    if (!isMatchInContestSeason(match, contest?.season_length)) continue
    if (!match.utcDate || isPredictionLocked(match.utcDate, now)) continue

    const homeScore = Number(prediction.homeScore)
    const awayScore = Number(prediction.awayScore)
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) continue
    if (homeScore < 0 || homeScore > 5 || awayScore < 0 || awayScore > 5) continue

    payloads.push({
      user_id: user.id,
      contest_id: contestId,
      match_id: String(prediction.matchId),
      predicted_home_score: homeScore,
      predicted_away_score: awayScore,
      updated_at: updatedAt,
    })
  }

  if (payloads.length === 0) {
    throw new Error('No unlocked matches left to fill this gameweek.')
  }

  const admin = createAdminClient()
  const { error: upsertError } = await admin
    .from('predictions')
    .upsert(payloads, { onConflict: 'user_id,contest_id,match_id' })

  if (upsertError) {
    throw new Error(`Supabase Save Error: ${upsertError.message}`)
  }

  revalidatePath(`/contests/${contestId}/predictions`)
  revalidatePath(`/contests/${contestId}`)

  return { success: true, saved: payloads.length }
}
