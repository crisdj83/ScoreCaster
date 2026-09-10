'use client'

import { useEffect } from 'react'
import { isChunkLoadError } from '../../lib/client-errors'

async function clearAppCaches() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
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
      void clearAppCaches().finally(() => {
        window.location.reload()
      })
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
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        void registration.update()
        if ('caches' in window) {
          void caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== 'xactscore-shell-v5').map((key) => caches.delete(key)))
          )
        }
      })
      .catch(() => {
        /* ignore registration failures */
      })

    try {
      sessionStorage.removeItem('xactscore-chunk-reload')
      sessionStorage.removeItem('xactscore-global-error-reload')
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
