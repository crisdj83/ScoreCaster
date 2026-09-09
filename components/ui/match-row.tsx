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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:shadow-none">
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
        "fixture-calendar-game mb-2.5 flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 dark:mb-0 dark:border-white/10 dark:bg-white/5 dark:p-4 dark:shadow-none dark:backdrop-blur-xl dark:hover:shadow-none",
        className
      )}
    >
      {meta || status ? (
        <div className="mb-2 flex w-full items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <div>{meta}</div>
          <div>{status}</div>
        </div>
      ) : null}

      <div className="flex w-full items-center gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:justify-end">
          <Crest src={home.crest} name={home.name} />
          <span className="truncate text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100 sm:text-right">
            {home.name}
          </span>
        </div>

        <div className="flex items-center justify-center">
          {score ?? (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              vs
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Crest src={away.crest} name={away.name} />
          <span className="truncate text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">{away.name}</span>
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
        "prediction-fixture-content overflow-hidden rounded-2xl border-0 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:p-4 dark:border-white/10 dark:shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { ScoreBadge }
