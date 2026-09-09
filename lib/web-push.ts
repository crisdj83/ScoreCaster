import webpush from 'web-push'
import { createAdminClient } from './supabase/admin'
import { normalizeVapidPublicKey } from './vapid'

type PushKeys = {
  p256dh: string
  auth: string
}

export type StoredPushSubscription = {
  endpoint: string
  p256dh: string
  auth: string
}

function vapidConfigured() {
  return Boolean(
    normalizeVapidPublicKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) &&
      normalizeVapidPublicKey(process.env.VAPID_PRIVATE_KEY)
  )
}

function setVapid() {
  const publicKey = normalizeVapidPublicKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  const privateKey = normalizeVapidPublicKey(process.env.VAPID_PRIVATE_KEY)
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@xactscore.app',
    publicKey,
    privateKey
  )
  return true
}

export function isPushConfigured() {
  return vapidConfigured()
}

export async function sendWebPush(
  subscription: StoredPushSubscription,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  if (!setVapid()) {
    throw new Error('Web push is not configured')
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        } satisfies PushKeys,
      },
      JSON.stringify(payload)
    )
    return { gone: false }
  } catch (error) {
    const status = typeof error === 'object' && error && 'statusCode' in error
      ? Number((error as { statusCode?: number }).statusCode)
      : 0
    if (status === 404 || status === 410) {
      const admin = createAdminClient()
      await admin.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
      return { gone: true }
    }
    throw error
  }
}
