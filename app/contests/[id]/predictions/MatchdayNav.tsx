'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MatchdayStrip from '../../../components/MatchdayStrip'

export default function MatchdayNav({
  contestId,
  matchdays,
  selected,
  active,
}: {
  contestId: string
  matchdays: number[]
  selected: number
  active: number | null
}) {
  const router = useRouter()

  const onSelect = useCallback(
    (matchday: number) => {
      router.push(
        matchday === active
          ? `/contests/${contestId}/predictions`
          : `/contests/${contestId}/predictions?md=${matchday}`
      )
    },
    [router, contestId, active]
  )

  return <MatchdayStrip matchdays={matchdays} selected={selected} onSelect={onSelect} />
}
