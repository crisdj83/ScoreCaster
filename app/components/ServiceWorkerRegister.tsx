'use client'

import { useEffect } from 'react'

function isChunkLoadError(error: unknown) {
  if (!error) return false
  const message = error instanceof Error ? error.message : String(error)
  const name = error instanceof Error ? error.name : ''
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  )
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const reloadForChunkError = () => {
      const key = 'xactscore-chunk-reload'
      try {
        if (sessionStorage.getItem(key) === '1') return
        sessionStorage.setItem(key, '1')
      } catch {
        /* private mode */
      }
      window.location.reload()
    }

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
        reloadForChunkError()
      }
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        reloadForChunkError()
      }
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)

    void navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        void registration.update()
        // Clear any legacy cached Next chunks from older SW versions.
        if ('caches' in window) {
          void caches.keys().then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith('xactscore-shell-') && key !== 'xactscore-shell-v4')
                .map((key) => caches.delete(key))
            )
          )
        }
      })
      .catch(() => {
        /* ignore registration failures */
      })

    try {
      sessionStorage.removeItem('xactscore-chunk-reload')
    } catch {
      /* private mode */
    }

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
