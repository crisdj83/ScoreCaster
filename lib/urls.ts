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
