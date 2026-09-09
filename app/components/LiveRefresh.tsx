'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LiveRefresh({
  refreshAfter,
  always = false,
  pingUrl,
}: {
  refreshAfter: string[]
  always?: boolean
  pingUrl?: string
}) {
  const router = useRouter()

  useEffect(() => {
    if (!refreshAfter.length) return
    const refresh = () => {
      if (always || refreshAfter.some(date => new Date(date).getTime() <= Date.now())) {
        router.refresh()
      }
    }
    const interval = window.setInterval(refresh, always ? 60 * 1000 : 5 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [always, refreshAfter, router])

  useEffect(() => {
    if (!pingUrl) return
    const ping = () => {
      void fetch(pingUrl, { method: 'GET' })
    }
    ping()
    const interval = window.setInterval(ping, 10 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [pingUrl])

  return null
}
