export function errorText(error: unknown) {
  if (!error) return ''
  if (error instanceof Error) return `${error.name} ${error.message}`
  return String(error)
}

/** Stale Next.js build chunk after a deploy. */
export function isChunkLoadError(error: unknown) {
  const name = error instanceof Error ? error.name : ''
  const message = errorText(error)
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /Importing a module script failed/i.test(message)
  )
}

/**
 * Client navigations abort the previous RSC/chunk fetch. Android Chrome
 * surfaces that as an error for a frame — it is not a real crash.
 */
export function isTransientNavigationError(error: unknown) {
  const name = error instanceof Error ? error.name : ''
  const message = errorText(error)
  return (
    name === 'AbortError' ||
    /abort(ed)?/i.test(message) ||
    /Failed to fetch/i.test(message) ||
    /Load failed/i.test(message) ||
    /NetworkError/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message)
  )
}
