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
        aria-expanded={canExpand ? isExpanded : undefined}
        onClick={() => canExpand && setIsExpanded((prev) => !prev)}
        className={cn(
          "flex min-h-10 w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-200",
          canExpand && "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]"
        )}
      >
        {trigger}
        {canExpand ? (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-300",
              isExpanded && "rotate-180 text-zinc-300"
            )}
          />
        ) : null}
      </button>

      {canExpand && isExpanded ? (
        <div className="border-t border-white/[0.06] bg-white/[0.03] px-3 py-2">
          {content}
        </div>
      ) : null}
    </li>
  )
}
