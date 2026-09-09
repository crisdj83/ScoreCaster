import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap backdrop-blur-md",
  {
    variants: {
      variant: {
        default: "border border-xactscore-border bg-xactscore-surface text-xactscore-text",
        accent: "border-0 bg-indigo-100 text-indigo-700 dark:border dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-orange-300",
        success: "border-0 bg-emerald-100 text-emerald-700 dark:border dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
        danger: "border-0 bg-rose-100 text-rose-700 dark:border dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
        muted: "border border-xactscore-border bg-xactscore-surface text-xactscore-muted",
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
        "inline-flex min-w-[2.5rem] items-center justify-center rounded-2xl border border-slate-200 bg-white px-2.5 py-1 text-sm font-bold text-slate-900 shadow-sm dark:border-0 dark:bg-gradient-to-b dark:from-amber-400 dark:to-orange-600 dark:font-black dark:text-white dark:shadow-md dark:shadow-orange-500/25",
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
        "inline-flex flex-col items-center rounded-xl border border-xactscore-border bg-xactscore-surface px-3 py-2 backdrop-blur-md",
        className
      )}
      {...props}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-xactscore-muted">
        {label}
      </span>
      <span className="text-sm font-black text-xactscore-text">{value}</span>
    </div>
  )
}

export { Badge, ScoreBadge, StatPill, badgeVariants }
