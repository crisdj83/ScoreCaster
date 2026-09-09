/** Strip quotes/whitespace that often sneak into Vercel env values. */
export function normalizeVapidPublicKey(raw: string | null | undefined): string {
  if (!raw) return ''
  return String(raw)
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/\s+/g, '')
}

/**
 * Decode a VAPID applicationServerKey for PushManager.subscribe.
 * Throws with a stable message when the key is malformed.
 */
export function vapidPublicKeyToUint8Array(raw: string): Uint8Array {
  const cleaned = normalizeVapidPublicKey(raw)
  if (!cleaned) {
    throw new Error('VAPID_PUBLIC_KEY_MISSING')
  }
  // URL-safe or standard base64 (optional padding)
  if (!/^[A-Za-z0-9\-_+]+={0,2}$/.test(cleaned)) {
    throw new Error('VAPID_PUBLIC_KEY_INVALID')
  }

  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4)
  const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/')

  try {
    const rawData = globalThis.atob(base64)
    const output = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i += 1) {
      output[i] = rawData.charCodeAt(i)
    }
    // Uncompressed P-256 public keys are 65 bytes
    if (output.length !== 65) {
      throw new Error('VAPID_PUBLIC_KEY_INVALID')
    }
    return output
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('VAPID_')) throw error
    throw new Error('VAPID_PUBLIC_KEY_INVALID')
  }
}
