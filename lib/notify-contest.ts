import { createAdminClient } from './supabase/admin'
import { isPushConfigured, sendWebPush } from './web-push'
import { siteUrl } from './urls'

function clip(text: string, max = 120) {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

export async function notifyContestMembers(options: {
  contestId: string
  authorId: string
  title: string
  body: string
  kind: 'message' | 'reply'
}) {
  if (!isPushConfigured()) return

  try {
    const admin = createAdminClient()
    const [{ data: members }, { data: contest }, { data: author }] = await Promise.all([
      admin.from('contest_members').select('user_id').eq('contest_id', options.contestId),
      admin.from('contests').select('name').eq('id', options.contestId).maybeSingle(),
      admin.from('users').select('username, email').eq('id', options.authorId).maybeSingle(),
    ])

    const recipientIds = Array.from(
      new Set((members || []).map((row) => row.user_id as string).filter((id) => id && id !== options.authorId))
    )
    if (recipientIds.length === 0) return

    const { data: subscriptions } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', recipientIds)

    if (!subscriptions?.length) return

    const name = (author?.username || author?.email?.split('@')[0] || 'Someone').trim()
    const league = contest?.name || 'your league'
    const origin = siteUrl()
    const payload =
      options.kind === 'reply'
        ? {
            title: 'XactScore',
            body: `${name} replied in ${league}: ${clip(options.body)}`,
            url: `${origin}/news`,
            tag: 'xactscore-messages',
          }
        : {
            title: 'XactScore',
            body: `${name} in ${league}: ${clip(options.title)}`,
            url: `${origin}/news`,
            tag: 'xactscore-messages',
          }

    await Promise.allSettled(
      subscriptions.map((sub) =>
        sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        )
      )
    )
  } catch (error) {
    console.warn('notifyContestMembers failed:', error)
  }
}
