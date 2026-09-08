export function isCronAuthorized(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.XACTSCORE_SYNC_SECRET || process.env.SCORECASTER_SYNC_SECRET
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (expectedSecret && (secret === expectedSecret || bearer === expectedSecret)) return true
  if (cronSecret && bearer === cronSecret) return true
  return false
}
