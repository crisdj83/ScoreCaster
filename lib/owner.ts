/**
 * Site-owner email gate for homepage/news publishing.
 * Set SCORECASTER_OWNER_EMAIL in production — there is no production fallback.
 */
export function ownerEmail() {
  const email = process.env.SCORECASTER_OWNER_EMAIL?.trim()
  if (email) return email.toLowerCase()

  const isProd =
    process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  if (isProd) return ''

  // Local/dev only — set SCORECASTER_OWNER_EMAIL to override.
  return 'cris.the.dj@gmail.com'
}

export function isSiteOwner(email?: string | null) {
  const owner = ownerEmail()
  if (!owner) return false
  return typeof email === 'string' && email.toLowerCase() === owner
}
