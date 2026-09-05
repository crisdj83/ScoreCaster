"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type ExpandableRowProps = {
  trigger: React.ReactNode
  content: React.ReactNode | null
  className?: string
}

/**
 * Client-only wrapper for the mobile compact row toggle behavior.
 * Receives already-rendered nodes (not functions) so it can safely be
 * imported into server components without breaking the RSC boundary.
 */
export function ExpandableRow({ trigger, content, className }: ExpandableRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const canExpand = Boolean(content)

  return (
    <li className={className}>
      <button
        type="button"
        disabled={!canExpand}
        onClick={() => canExpand && setIsExpanded((prev) => !prev)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-200 active:bg-white/[0.06]",
          canExpand && "cursor-pointer hover:bg-white/[0.04]"
        )}
      >
        {trigger}
        {canExpand ? (
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300",
              isExpanded && "rotate-180 text-zinc-300"
            )}
          />
        ) : null}
      </button>

      {canExpand && isExpanded ? (
        <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] bg-black/20 px-3 py-2.5 sm:grid-cols-4">
          {content}
        </div>
      ) : null}
    </li>
  )
}
