import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-zinc-800 text-zinc-200 border border-zinc-700",
        accent: "bg-scorecaster-accent/15 text-scorecaster-accent border border-scorecaster-accent/30",
        success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        danger: "bg-red-500/15 text-red-400 border border-red-500/30",
        muted: "bg-zinc-800/60 text-zinc-400 border border-zinc-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

function ScoreBadge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-scorecaster-accent px-2.5 py-1 text-sm font-black text-scorecaster-bg",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

function StatPill({
  className,
  label,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label: string; value: React.ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2",
        className
      )}
      {...props}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span className="text-sm font-black text-zinc-100">{value}</span>
    </div>
  )
}

export { Badge, ScoreBadge, StatPill, badgeVariants }
