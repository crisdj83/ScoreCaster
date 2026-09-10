'use client'

import { useEffect } from 'react'

async function recoverFromStaleClient() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch {
    /* ignore */
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root layout error:', error)
    const key = 'xactscore-global-error-reload'
    try {
      if (sessionStorage.getItem(key) === '1') return
      sessionStorage.setItem(key, '1')
    } catch {
      return
    }
    void recoverFromStaleClient().finally(() => {
      window.location.replace(window.location.href)
    })
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-[100dvh] items-center justify-center bg-[#0f0f10] text-[#f4f4f5]">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-zinc-400">
            The app hit an unexpected error. Please try again.
          </p>
          <button
            onClick={() => {
              void recoverFromStaleClient().finally(() => {
                reset()
                window.location.reload()
              })
            }}
            className="rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-medium text-[#0f0f10] hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
