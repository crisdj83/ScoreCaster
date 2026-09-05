import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-scorecaster-border bg-scorecaster-card p-8 text-center">
      <SearchX className="h-10 w-10 text-scorecaster-muted" />
      <h1 className="text-lg font-semibold text-scorecaster-text">Page not found</h1>
      <p className="text-sm text-scorecaster-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-scorecaster-accent px-4 py-2 text-sm font-medium text-scorecaster-bg hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  )
}
