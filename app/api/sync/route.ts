import { NextResponse } from 'next/server'
import { getPLMatches } from '../../../lib/football'
import { isMatchInContestSeason } from '../../../lib/contest-season'
import { calculatePoints, resolveContestScoring } from '../../../lib/scoring'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

type PredictionRow = {
  id: string
  contest_id: string
  predicted_home_score: number
  predicted_away_score: number
  points: number | null
  is_correct: boolean | null
  is_exact: boolean | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.SCORECASTER_SYNC_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
  }

  let supabaseAdmin
  try {
    supabaseAdmin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error: Missing Supabase keys' }, { status: 500 })
  }

  try {
    const data = await getPLMatches()
    const finishedMatches = (data.matches || []).filter((match: { status?: string }) => match.status === 'FINISHED')

    const { data: contests, error: contestsError } = await supabaseAdmin
      .from('contests')
      .select('id, season_length, points_exact, points_close, points_result')

    if (contestsError) {
      return NextResponse.json({ error: contestsError.message }, { status: 500 })
    }

    const scoringByContest = new Map(
      (contests || []).map(contest => [contest.id, {
        scoring: resolveContestScoring(contest),
        seasonLength: contest.season_length,
      }])
    )

    const pendingUpdates: Array<{
      id: string
      points: number
      is_correct: boolean
      is_exact: boolean
    }> = []

    for (const match of finishedMatches) {
      const homeActual = match.score?.fullTime?.home
      const awayActual = match.score?.fullTime?.away
      if (homeActual === null || homeActual === undefined || awayActual === null || awayActual === undefined) {
        continue
      }

      const { data: predictions, error: fetchError } = await supabaseAdmin
        .from('predictions')
        .select('id, contest_id, predicted_home_score, predicted_away_score, points, is_correct, is_exact')
        .eq('match_id', match.id)

      if (fetchError || !predictions) continue

      for (const prediction of predictions as PredictionRow[]) {
        const contest = scoringByContest.get(prediction.contest_id)
        if (!contest || !isMatchInContestSeason(match, contest.seasonLength)) continue

        const result = calculatePoints(
          prediction.predicted_home_score,
          prediction.predicted_away_score,
          homeActual,
          awayActual,
          contest.scoring
        )

        if (
          prediction.points !== result.points ||
          prediction.is_correct !== result.is_correct ||
          prediction.is_exact !== result.is_exact
        ) {
          pendingUpdates.push({
            id: prediction.id,
            points: result.points,
            is_correct: result.is_correct,
            is_exact: result.is_exact,
          })
        }
      }
    }

    const updatedAt = new Date().toISOString()
    const chunkSize = 25
    for (let index = 0; index < pendingUpdates.length; index += chunkSize) {
      const chunk = pendingUpdates.slice(index, index + chunkSize)
      await Promise.all(chunk.map(update =>
        supabaseAdmin
          .from('predictions')
          .update({
            points: update.points,
            is_correct: update.is_correct,
            is_exact: update.is_exact,
            updated_at: updatedAt,
          })
          .eq('id', update.id)
      ))
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. ${pendingUpdates.length} predictions updated.`,
      finished_matches_processed: finishedMatches.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
