'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LiveRefresh({ refreshAfter }: { refreshAfter: string[] }) {
  const router = useRouter()

  useEffect(() => {
    if (!refreshAfter.length) return
    const refresh = () => {
      if (refreshAfter.some(date => new Date(date).getTime() <= Date.now())) {
        router.refresh()
      }
    }
    const interval = window.setInterval(refresh, 5 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [refreshAfter, router])

  return null
}
