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
 * Uses a div row + separate chevron button so nested links (e.g. profile
 * names) remain tappable.
 */
export function ExpandableRow({ trigger, content, className }: ExpandableRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const canExpand = Boolean(content)

  return (
    <li className={className}>
      <div
        className={cn(
          "flex min-h-12 w-full items-center gap-2 px-2.5 py-2 text-left transition-colors duration-200",
          canExpand && "hover:bg-white/[0.04] active:bg-white/[0.06]"
        )}
      >
        {trigger}
        {canExpand ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Hide details" : "Show details"}
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full text-zinc-500 touch-manipulation"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                isExpanded && "rotate-180 text-zinc-300"
              )}
            />
          </button>
        ) : null}
      </div>

      {canExpand && isExpanded ? (
        <div className="border-t border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
          {content}
        </div>
      ) : null}
    </li>
  )
}
