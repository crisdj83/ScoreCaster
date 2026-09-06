'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-xactscore-border bg-xactscore-card p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-red-400" />
      <h1 className="text-lg font-semibold text-xactscore-text">Something went wrong</h1>
      <p className="text-sm text-xactscore-muted">
        We hit an unexpected error loading this page. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-xactscore-border bg-xactscore-surface px-4 py-2 text-sm font-medium text-xactscore-text hover:bg-xactscore-card"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg bg-xactscore-accent px-4 py-2 text-sm font-medium text-xactscore-bg hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
