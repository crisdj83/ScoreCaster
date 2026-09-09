import type { SupabaseClient } from '@supabase/supabase-js'
import { getPLMatches } from './football'
import { getLiveGoalScorers, type FootballMatchRef, type LiveScorers } from './api-football'
import { createAdminClient } from './supabase/admin'
import { chunk } from './utils'

type PlMatch = FootballMatchRef & {
  status?: string
}

function isLive(status?: string) {
  return ['IN_PLAY', 'PAUSED'].includes(status || '')
}

function utcDayStart(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
}

/** True when the kickoff calendar day (UTC) is yesterday — one confirmation pass after FT. */
function kickedOffYesterday(utcDate: string, now = new Date()) {
  const kickoff = new Date(utcDate)
  if (!Number.isFinite(kickoff.getTime())) return false
  return utcDayStart(kickoff) === utcDayStart(now) - 24 * 60 * 60 * 1000
}

export async function loadStoredScorers(
  supabase: SupabaseClient,
  matchIds: string[]
): Promise<Map<string, LiveScorers>> {
  const stored = new Map<string, LiveScorers>()
  if (!matchIds.length) return stored

  try {
    for (const ids of chunk(matchIds, 100)) {
      const { data, error } = await supabase
        .from('match_scorers')
        .select('match_id, home_scorers, away_scorers, elapsed')
        .in('match_id', ids)
      if (error) {
        console.error('match_scorers read failed:', error.message)
        return stored
      }
      for (const row of data || []) {
        stored.set(String(row.match_id), {
          home: row.home_scorers || [],
          away: row.away_scorers || [],
          elapsed: row.elapsed ?? null,
        })
      }
    }
  } catch (error) {
    console.error('match_scorers read failed:', error)
  }
  return stored
}

async function persistScorerRows(
  rows: Array<{
    matchId: string
    home: string[]
    away: string[]
    elapsed?: number | null
    status?: string
  }>
) {
  if (!rows.length) return 0
  const supabaseAdmin = createAdminClient()
  const payload = rows.map((row) => ({
    match_id: row.matchId,
    home_scorers: row.home,
    away_scorers: row.away,
    elapsed: row.elapsed ?? null,
    match_status: row.status || null,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabaseAdmin.from('match_scorers').upsert(payload, { onConflict: 'match_id' })
  if (error) {
    console.error('match_scorers upsert failed:', error.message)
    return 0
  }
  return payload.length
}

export async function refreshAndStoreScorers(mode: 'live' | 'daily') {
  const data = await getPLMatches()
  const matches = ((data.matches || []) as PlMatch[]).filter((match) => match?.id != null)
  const liveMatches = matches.filter((match) => isLive(match.status))

  const toFetch: PlMatch[] =
    mode === 'live'
      ? liveMatches
      : matches.filter((match) => match.status === 'FINISHED' && kickedOffYesterday(match.utcDate))

  const unique = Array.from(new Map(toFetch.map((match) => [String(match.id), match])).values())
  const scorers = await getLiveGoalScorers(unique)

  const rows = unique
    .filter((match) => scorers.has(String(match.id)))
    .map((match) => {
      const item = scorers.get(String(match.id))!
      return {
        matchId: String(match.id),
        home: item.home,
        away: item.away,
        elapsed: item.elapsed ?? null,
        status: match.status,
      }
    })

  const saved = await persistScorerRows(rows)
  return {
    fetched: unique.length,
    saved,
    live: liveMatches.length,
  }
}
