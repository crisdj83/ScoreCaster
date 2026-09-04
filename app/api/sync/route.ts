import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPLMatches } from '../../../lib/football'

// Force Next.js not to cache this API route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // 1. Basic security: Require a secret password in the URL to trigger the sync
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  if (secret !== 'cron123') {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
  }

  // 2. SAFETY CHECK: Ensure the environment variables exist
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server configuration error: Missing Supabase keys in .env.local' }, { status: 500 })
  }

  // 3. Create the admin client directly in this file to avoid import/export bugs
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // 4. Fetch the live data from football-data.org
    const data = await getPLMatches()
    
    // Filter for matches that are actually over
    const finishedMatches = data.matches.filter((m: any) => m.status === 'FINISHED')

    let updateCount = 0

    // 5. Loop through every finished match
    for (const match of finishedMatches) {
      const matchId = match.id
      const homeActual = match.score.fullTime.home
      const awayActual = match.score.fullTime.away

      // Skip if for some reason the score is null
      if (homeActual === null || awayActual === null) continue

      const actualOutcome = homeActual > awayActual ? 'HOME' : homeActual < awayActual ? 'AWAY' : 'DRAW'
      const actualTotalGoals = homeActual + awayActual

      // 6. Fetch all predictions made by users for this specific match
      const { data: predictions, error: fetchError } = await supabaseAdmin
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)

      if (fetchError || !predictions) continue

      // 7. Grade each prediction
      for (const prediction of predictions) {
        const homePred = prediction.predicted_home_score
        const awayPred = prediction.predicted_away_score

        // Check for Exact match (3 pts)
        const isExact = homeActual === homePred && awayActual === awayPred
        
        // Check for Correct Outcome (Home/Away/Draw)
        const predictedOutcome = homePred > awayPred ? 'HOME' : homePred < awayPred ? 'AWAY' : 'DRAW'
        const isCorrect = actualOutcome === predictedOutcome

        // Calculate the goal difference for the "Close" rule
        const predictedTotalGoals = homePred + awayPred
        const totalGoalsDiff = Math.abs(actualTotalGoals - predictedTotalGoals)
        
        // It is "Close" if they got the outcome right, but weren't exact, AND total goals are off by 1 or 0
        const isClose = isCorrect && !isExact && (totalGoalsDiff <= 1)

        // Assign the points based on your new tiered system
        let points = 0
        if (isExact) {
          points = 3
        } else if (isClose) {
          points = 1.5
        } else if (isCorrect) {
          points = 1
        }

        // 8. Save the points to the database ONLY if they haven't been saved yet
        if (prediction.points !== points) {
          await supabaseAdmin
            .from('predictions')
            .update({
              points,
              is_correct: isCorrect,
              is_exact: isExact,
              updated_at: new Date().toISOString()
            })
            .eq('id', prediction.id)

          updateCount++
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sync complete. ${updateCount} predictions updated.`,
      finished_matches_processed: finishedMatches.length
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}