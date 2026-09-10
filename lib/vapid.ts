/** Strip quotes, labels, and whitespace that often sneak into Vercel env values. */
export function normalizeVapidPublicKey(raw: string | null | undefined): string {
  if (!raw) return ''
  return String(raw)
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/^(public\s*key|vapid[_ ]?public[_ ]?key)\s*[:=]\s*/i, '')
    .replace(/\s+/g, '')
}

/** Dynamic lookup so Next cannot bake an empty NEXT_PUBLIC_ value in at build time. */
function readEnv(name: string) {
  if (typeof process === 'undefined' || !process.env) return ''
  return process.env[name] || ''
}

function envPublicKey() {
  return normalizeVapidPublicKey(readEnv('VAPID_PUBLIC_KEY') || readEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY'))
}

export function envVapidPrivateKey() {
  return normalizeVapidPublicKey(readEnv('VAPID_PRIVATE_KEY'))
}

export function envVapidSubject() {
  return readEnv('VAPID_SUBJECT').trim() || 'mailto:noreply@xactscore.app'
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
  if (!/^[A-Za-z0-9\-_+/=]+$/.test(cleaned)) {
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
    // Uncompressed P-256 public keys are 65 bytes starting with 0x04
    if (output.length !== 65 || output[0] !== 0x04) {
      throw new Error('VAPID_PUBLIC_KEY_INVALID')
    }
    return output
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('VAPID_')) throw error
    throw new Error('VAPID_PUBLIC_KEY_INVALID')
  }
}

export function isValidVapidPublicKey(raw: string | null | undefined): boolean {
  try {
    vapidPublicKeyToUint8Array(raw || '')
    return true
  } catch {
    return false
  }
}

/** Validated public key from env, or empty if missing/malformed. */
export function resolveVapidPublicKey() {
  const key = envPublicKey()
  return isValidVapidPublicKey(key) ? key : ''
}

/**
 * Standalone 65-byte key for PushManager.subscribe.
 * Chrome Android rejects shared/offset views and some Uint8Array copies.
 */
export function vapidApplicationServerKey(raw: string): Uint8Array {
  const bytes = vapidPublicKeyToUint8Array(raw)
  const buffer = new ArrayBuffer(bytes.byteLength)
  const copy = new Uint8Array(buffer)
  copy.set(bytes)
  return copy
}

export function vapidApplicationServerKeyBuffer(raw: string): ArrayBuffer {
  const bytes = vapidApplicationServerKey(raw)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
