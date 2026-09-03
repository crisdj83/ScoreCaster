'use server'

import { createClient } from '../../../../lib/supabase/server'
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

  const { data: existingPrediction } = await supabase
    .from('predictions')
    .select('id')
    .eq('user_id', user.id)
    .eq('contest_id', contestId)
    .eq('match_id', matchId)
    .single()

  if (existingPrediction) {
    const { error: updateError } = await supabase
      .from('predictions')
      .update({ 
        predicted_home_score: homeScore,   // FIXED COLUMN NAME
        predicted_away_score: awayScore,   // FIXED COLUMN NAME
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPrediction.id)

    if (updateError) {
      throw new Error(`Supabase Update Error: ${updateError.message}`)
    }
  } else {
    const { error: insertError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        contest_id: contestId,
        match_id: matchId,
        predicted_home_score: homeScore,   // FIXED COLUMN NAME
        predicted_away_score: awayScore    // FIXED COLUMN NAME
      })

    if (insertError) {
      throw new Error(`Supabase Insert Error: ${insertError.message}`)
    }
  }

  revalidatePath(`/contests/${contestId}/predictions`)
  revalidatePath(`/contests/${contestId}`)
  
  return { success: true }
}