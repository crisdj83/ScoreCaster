'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function ContestError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Contest page error:', error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-scorecaster-border bg-scorecaster-card p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-red-400" />
      <h1 className="text-lg font-semibold text-scorecaster-text">Couldn&apos;t load this contest</h1>
      <p className="text-sm text-scorecaster-muted">
        Something went wrong fetching the contest data. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-scorecaster-border bg-scorecaster-surface px-4 py-2 text-sm font-medium text-scorecaster-text hover:bg-scorecaster-card"
        >
          Try again
        </button>
        <Link
          href="/contests"
          className="rounded-lg bg-scorecaster-accent px-4 py-2 text-sm font-medium text-scorecaster-bg hover:opacity-90"
        >
          Back to contests
        </Link>
      </div>
    </div>
  )
}
