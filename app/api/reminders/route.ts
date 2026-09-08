import { NextResponse } from 'next/server'
import { getPLMatches } from '../../../lib/football'
import { isMatchInContestSeason } from '../../../lib/contest-season'
import { isCronAuthorized } from '../../../lib/cron-auth'
import { createAdminClient } from '../../../lib/supabase/admin'
import { isPushConfigured, sendWebPush } from '../../../lib/web-push'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const WINDOW_MS = 30 * 60 * 1000

type UpcomingMatch = {
  id: number
  utcDate: string
  matchday?: number | null
  status?: string
  homeTeam?: { name?: string; shortName?: string }
  awayTeam?: { name?: string; shortName?: string }
}

type Membership = {
  user_id: string
  contest_id: string
  contests: { id: string; season_length: string | null } | { id: string; season_length: string | null }[] | null
}

function contestFromMembership(membership: Membership) {
  return Array.isArray(membership.contests) ? membership.contests[0] : membership.contests
}

function matchLabel(match: UpcomingMatch) {
  const home = match.homeTeam?.shortName || match.homeTeam?.name || 'Home'
  const away = match.awayTeam?.shortName || match.awayTeam?.name || 'Away'
  return `${home} vs ${away}`
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ success: true, skipped: 'Web push is not configured' })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error: Missing Supabase keys' }, { status: 500 })
  }

  try {
    const data = await getPLMatches()
    const now = Date.now()
    const windowStart = now + TWO_HOURS_MS - WINDOW_MS
    const windowEnd = now + TWO_HOURS_MS + WINDOW_MS

    const upcoming = ((data.matches || []) as UpcomingMatch[]).filter((match) => {
      if (!['TIMED', 'SCHEDULED'].includes(String(match.status || ''))) return false
      const kickoff = new Date(match.utcDate).getTime()
      return Number.isFinite(kickoff) && kickoff >= windowStart && kickoff <= windowEnd
    })

    if (upcoming.length === 0) {
      return NextResponse.json({ success: true, sent: 0, matches: 0 })
    }

    const matchIds = upcoming.map((match) => Number(match.id)).filter((id) => Number.isFinite(id))
    const { data: subscriptions, error: subError } = await admin
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 })
    }

    const userIds = Array.from(new Set((subscriptions || []).map((row) => row.user_id as string)))
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, sent: 0, subscribers: 0, matches: upcoming.length })
    }

    const [{ data: memberships }, { data: predictions }, { data: alreadySent }] = await Promise.all([
      admin
        .from('contest_members')
        .select('user_id, contest_id, contests(id, season_length)')
        .in('user_id', userIds),
      admin
        .from('predictions')
        .select('user_id, contest_id, match_id')
        .in('user_id', userIds)
        .in('match_id', matchIds),
      admin
        .from('match_reminders')
        .select('user_id, match_id')
        .in('user_id', userIds)
        .in('match_id', matchIds),
    ])

    const predicted = new Set(
      (predictions || []).map((row) => `${row.user_id}:${row.contest_id}:${Number(row.match_id)}`)
    )
    const sent = new Set((alreadySent || []).map((row) => `${row.user_id}:${Number(row.match_id)}`))
    const membershipsByUser = new Map<string, Membership[]>()
    for (const membership of (memberships || []) as Membership[]) {
      const list = membershipsByUser.get(membership.user_id) || []
      list.push(membership)
      membershipsByUser.set(membership.user_id, list)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xactscore.app'
    let sentCount = 0

    for (const userId of userIds) {
      const userMemberships = membershipsByUser.get(userId) || []
      const missing: UpcomingMatch[] = []
      let deepLinkContestId: string | null = null

      for (const match of upcoming) {
        if (sent.has(`${userId}:${Number(match.id)}`)) continue
        const relevant = userMemberships.filter((membership) => {
          const contest = contestFromMembership(membership)
          return contest && isMatchInContestSeason(match, contest.season_length)
        })
        if (relevant.length === 0) continue

        const needsPick = relevant.some(
          (membership) => !predicted.has(`${userId}:${membership.contest_id}:${Number(match.id)}`)
        )
        if (!needsPick) continue

        missing.push(match)
        if (!deepLinkContestId) deepLinkContestId = relevant[0].contest_id
        else if (deepLinkContestId !== relevant[0].contest_id) deepLinkContestId = 'many'
      }

      if (missing.length === 0) continue

      const title = 'XactScore'
      const body =
        missing.length === 1
          ? `${matchLabel(missing[0])} kicks off in about 2 hours. Put your score in before picks lock.`
          : `${missing.length} matches kick off in about 2 hours. Put your scores in before they lock.`
      const path =
        deepLinkContestId && deepLinkContestId !== 'many'
          ? `/contests/${deepLinkContestId}/predictions`
          : '/contests'

      const userSubs = (subscriptions || []).filter((row) => row.user_id === userId)
      let delivered = false
      for (const sub of userSubs) {
        try {
          const result = await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            { title, body, url: `${siteUrl}${path}` }
          )
          if (!result.gone) delivered = true
        } catch {
          // Keep trying other devices for this user.
        }
      }

      if (!delivered) continue

      await admin.from('match_reminders').upsert(
        missing.map((match) => ({
          user_id: userId,
          match_id: Number(match.id),
        })),
        { onConflict: 'user_id,match_id' }
      )
      sentCount += 1
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      matches: upcoming.length,
      subscribers: userIds.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reminders failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
