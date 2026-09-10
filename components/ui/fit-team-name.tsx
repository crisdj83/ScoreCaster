'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils'
import { teamDisplayName, teamTla, type TeamNameParts } from '@/lib/team-tla'

type FitGroupValue = {
  compact: boolean
  resetKey: string | number | undefined
  report: (id: string, overflows: boolean) => void
}

const TeamNameFitContext = createContext<FitGroupValue | null>(null)

export function TeamNameFitGroup({
  children,
  resetKey,
}: {
  children: ReactNode
  resetKey?: string | number
}) {
  const [overflows, setOverflows] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOverflows({})
  }, [resetKey])

  const report = useCallback((id: string, value: boolean) => {
    setOverflows((prev) => (prev[id] === value ? prev : { ...prev, [id]: value }))
  }, [])

  const compact = Object.values(overflows).some(Boolean)
  const value = useMemo(
    () => ({ compact, resetKey, report }),
    [compact, resetKey, report]
  )

  return <TeamNameFitContext.Provider value={value}>{children}</TeamNameFitContext.Provider>
}

export function FitTeamName({
  name,
  shortName,
  tla,
  className,
  align = 'left',
}: TeamNameParts & {
  className?: string
  align?: 'left' | 'right'
}) {
  const group = useContext(TeamNameFitContext)
  const id = useId()
  const boxRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const reportRef = useRef(group?.report)
  reportRef.current = group?.report
  const [selfOverflow, setSelfOverflow] = useState(false)
  const full = teamDisplayName({ name, shortName, tla })
  const code = teamTla({ name, shortName, tla })
  const compact = group ? group.compact : selfOverflow

  useLayoutEffect(() => {
    const box = boxRef.current
    const measure = measureRef.current
    if (!box || !measure) return

    const update = () => {
      const next = measure.scrollWidth - box.clientWidth > 1
      setSelfOverflow((prev) => (prev === next ? prev : next))
      reportRef.current?.(id, next)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(box)
    return () => observer.disconnect()
  }, [full, code, id, group?.resetKey])

  return (
    <span
      ref={boxRef}
      className={cn('relative block min-w-0 overflow-hidden', align === 'right' && 'text-right', className)}
      title={full === name ? name : `${full} (${name})`}
    >
      <span
        ref={measureRef}
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0 whitespace-nowrap opacity-0',
          align === 'right' ? 'right-0' : 'left-0'
        )}
      >
        {full}
      </span>
      <span className="block whitespace-nowrap">{compact ? code : full}</span>
      {compact ? <span className="sr-only">{full}</span> : null}
    </span>
  )
}
