import * as React from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-row items-center justify-between gap-3 sm:mb-8 sm:items-start",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-gradient-accent pb-0.5 text-xl font-bold leading-tight tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 hidden text-sm text-xactscore-muted sm:block">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-xactscore-border bg-xactscore-surface px-6 py-12 text-center backdrop-blur-xl",
        className
      )}
    >
      <p className="text-base font-bold text-xactscore-text">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-xactscore-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
