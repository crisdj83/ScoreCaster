export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://xactscore.app').replace(/\/$/, '')
}

export function safeNextPath(value: string | null | undefined) {
  if (!value) return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  if (value.includes('\\') || value.includes('://')) return '/'
  return value
}

export function inviteUrl(contestKey: string) {
  return `${siteUrl()}/join/${encodeURIComponent(contestKey.trim().toLowerCase())}`
}

export function loginPath(options?: { mode?: 'signin' | 'signup'; next?: string; message?: string }) {
  const params = new URLSearchParams()
  if (options?.mode === 'signup') params.set('mode', 'signup')
  if (options?.next && options.next !== '/') params.set('next', options.next)
  if (options?.message) params.set('message', options.message)
  const query = params.toString()
  return query ? `/login?${query}` : '/login'
}
