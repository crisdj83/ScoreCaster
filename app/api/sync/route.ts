import { NextResponse } from 'next/server'
import { getPLMatches } from '../../../lib/football'
import { isMatchInContestSeason } from '../../../lib/contest-season'
import { calculatePoints, resolveContestScoring } from '../../../lib/scoring'
import { createAdminClient } from '../../../lib/supabase/admin'
import { chunk } from '../../../lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type FootballMatch = {
  id: string | number
  status?: string
  matchday?: number | null
  score?: { fullTime?: { home?: number | null; away?: number | null } }
}

type PredictionRow = {
  id: string
  contest_id: string
  match_id: string | number
  predicted_home_score: number
  predicted_away_score: number
  points: number | null
  is_correct: boolean | null
  is_exact: boolean | null
}

function isAuthorized(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.XACTSCORE_SYNC_SECRET || process.env.SCORECASTER_SYNC_SECRET
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (expectedSecret && (secret === expectedSecret || bearer === expectedSecret)) return true
  if (cronSecret && bearer === cronSecret) return true
  return false
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
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
    const finishedMatches = (data.matches || []).filter((match: FootballMatch) => match.status === 'FINISHED') as FootballMatch[]
    const matchById = new Map(finishedMatches.map(match => [String(match.id), match]))

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

    const matchIds = Array.from(matchById.keys())
    const predictions: PredictionRow[] = []
    for (const ids of chunk(matchIds, 100)) {
      const { data: rows, error: fetchError } = await supabaseAdmin
        .from('predictions')
        .select('id, contest_id, match_id, predicted_home_score, predicted_away_score, points, is_correct, is_exact')
        .in('match_id', ids)
      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }
      if (rows) predictions.push(...(rows as PredictionRow[]))
    }

    const pendingUpdates: Array<{
      id: string
      points: number
      is_correct: boolean
      is_exact: boolean
    }> = []

    for (const prediction of predictions) {
      const match = matchById.get(String(prediction.match_id))
      if (!match) continue
      const homeActual = match.score?.fullTime?.home
      const awayActual = match.score?.fullTime?.away
      if (homeActual === null || homeActual === undefined || awayActual === null || awayActual === undefined) {
        continue
      }

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

    const updatedAt = new Date().toISOString()
    for (const updates of chunk(pendingUpdates, 25)) {
      await Promise.all(updates.map(update =>
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
