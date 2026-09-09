import { NextResponse } from 'next/server'
import { isCronAuthorized } from '../../../lib/cron-auth'
import { createClient } from '../../../lib/supabase/server'
import { refreshAndStoreScorers } from '../../../lib/match-scorers'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user && !isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
  }

  try {
    const result = await refreshAndStoreScorers('live')
    return NextResponse.json({ success: true, ...result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Scorer refresh failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
