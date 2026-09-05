'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LiveRefresh({ refreshAfter, always = false }: { refreshAfter: string[]; always?: boolean }) {
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

  return null
}
