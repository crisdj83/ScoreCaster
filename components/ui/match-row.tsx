import Image from "next/image"
import * as React from "react"

import { cn } from "@/lib/utils"
import { ScoreBadge } from "@/components/ui/badge"

type TeamSide = {
  name: string
  crest?: string | null
}

type MatchRowProps = {
  home: TeamSide
  away: TeamSide
  score?: React.ReactNode
  meta?: React.ReactNode
  status?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

function Crest({ src, name }: { src?: string | null; name: string }) {
  if (!src) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
        {name.slice(0, 2).toUpperCase()}
      </div>
    )
  }
  return (
    <Image
      src={src}
      alt={name}
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 object-contain"
      unoptimized={src.includes("dicebear") || src.includes("supabase")}
    />
  )
}

export function MatchRow({
  home,
  away,
  score,
  meta,
  status,
  className,
  children,
}: MatchRowProps) {
  return (
    <div
      className={cn(
        "fixture-calendar-game rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 transition-colors",
        className
      )}
    >
      {meta || status ? (
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-zinc-500">
          <div>{meta}</div>
          <div>{status}</div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4">
        <div className="flex items-center gap-3 sm:justify-end">
          <Crest src={home.crest} name={home.name} />
          <span className="truncate text-sm font-bold text-zinc-100 sm:text-right">
            {home.name}
          </span>
        </div>

        <div className="flex items-center justify-center">
          {score ?? (
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              vs
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Crest src={away.crest} name={away.name} />
          <span className="truncate text-sm font-bold text-zinc-100">{away.name}</span>
        </div>
      </div>

      {children}
    </div>
  )
}

export function MatchCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "prediction-fixture-content overflow-hidden rounded-xl border border-zinc-800 p-4 md:p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { ScoreBadge }
