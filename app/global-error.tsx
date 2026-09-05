'use client'

import { useEffect } from 'react'

// Catches errors thrown from the root layout itself (must render its own
// <html>/<body> since it replaces the root layout when triggered).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root layout error:', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-[#0f0f10] text-[#f4f4f5]">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-zinc-400">
            The app hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-medium text-[#0f0f10] hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
