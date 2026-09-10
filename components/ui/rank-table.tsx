import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { ExpandableRow } from "@/components/ui/expandable-row"

export type RankColumn<T> = {
  key: string
  header: React.ReactNode
  cell: (row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
  /** Hide entirely on mobile (still shown in desktop table) */
  hideOnMobile?: boolean
  /** Emphasize in mobile card header (legacy stacked-card mode only) */
  mobilePrimary?: boolean
  /** Show inside the collapsible "more stats" strip on mobile compact rows */
  mobileExpandable?: boolean
  /** Short label used in the mobile details dropdown */
  mobileHeader?: React.ReactNode
}

type RankTableProps<T> = {
  rows: T[]
  columns: RankColumn<T>[]
  getRowKey: (row: T, index: number) => string
  className?: string
  emptyMessage?: string
  mobileTitle?: (row: T, index: number) => React.ReactNode
  mobileSubtitle?: (row: T, index: number) => React.ReactNode
  /** Compact leading element for the mobile row, e.g. rank number/medal */
  mobileRank?: (row: T, index: number) => React.ReactNode
  /** Compact trailing bold stat for the mobile row, e.g. total points */
  mobileEnd?: (row: T, index: number) => React.ReactNode
  /** Inline icon stats shown on the compact mobile row (no dropdown) */
  mobileStats?: (row: T, index: number) => React.ReactNode
  /** One-line mobile rows; extra stats open in a dropdown when present */
  mobileSingleLine?: boolean
  /** When set, the whole compact mobile row navigates here (profile, etc.) */
  getRowHref?: (row: T, index: number) => string | null | undefined
}

export function RankTable<T>({
  rows,
  columns,
  getRowKey,
  className,
  emptyMessage = "No data yet.",
  mobileTitle,
  mobileSubtitle,
  mobileRank,
  mobileEnd,
  mobileStats,
  mobileSingleLine = false,
  getRowHref,
}: RankTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="glass-row px-4 py-10 text-center text-sm text-xactscore-muted">
        {emptyMessage}
      </div>
    )
  }

  const mobileColumns = columns.filter((c) => !c.hideOnMobile)
  const expandableColumns = mobileColumns.filter((c) => c.mobileExpandable)
  const compactMode = Boolean(mobileRank || mobileEnd || mobileStats)
  const showInlineSubtitle = !mobileSingleLine && Boolean(mobileSubtitle)

  return (
    <div className={cn("w-full", className)}>
      {compactMode ? (
        <ul className="glass-list divide-y divide-slate-100 overflow-hidden dark:divide-white/[0.06] md:hidden">
          {rows.map((row, index) => {
            const rowKey = getRowKey(row, index)
            const href = getRowHref?.(row, index) || null
            const subtitle =
              mobileSingleLine && mobileSubtitle ? mobileSubtitle(row, index) : null
            const details =
              expandableColumns.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {subtitle ? (
                    <div className="col-span-full truncate text-[11px] italic text-xactscore-accent">
                      {subtitle}
                    </div>
                  ) : null}
                  {expandableColumns.map((col) => (
                    <div
                      key={col.key}
                      className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-center dark:border-white/[0.06] dark:bg-black/20"
                    >
                      <div className="truncate text-[8px] font-semibold uppercase tracking-wide text-slate-500 dark:font-bold dark:tracking-wider dark:text-zinc-500">
                        {col.mobileHeader ?? col.header}
                      </div>
                      <div className="truncate text-[11px] font-medium tabular-nums text-slate-900 dark:font-bold dark:text-zinc-100">
                        {col.cell(row, index)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null

            const trigger = (
              <>
                {mobileRank ? (
                  <div className="flex min-w-6 shrink-0 items-center justify-center tabular-nums">
                    {mobileRank(row, index)}
                  </div>
                ) : null}

                <div className="flex min-w-0 flex-1 items-center">
                  <div className="min-w-0 flex-1 text-sm font-medium leading-snug tracking-tight text-slate-900 dark:text-[13px] dark:font-semibold dark:text-zinc-100">
                    {mobileTitle ? mobileTitle(row, index) : null}
                  </div>
                  {showInlineSubtitle ? (
                    <div className="mt-0.5 truncate text-[11px] leading-tight text-zinc-500">
                      {mobileSubtitle!(row, index)}
                    </div>
                  ) : null}
                </div>

                {mobileStats ? (
                  <div className="pointer-events-none flex shrink-0 items-center gap-1 whitespace-nowrap leading-none">
                    {mobileStats(row, index)}
                  </div>
                ) : null}

                {mobileEnd ? (
                  <div className="pointer-events-none min-w-[1.75rem] shrink-0 text-right text-sm font-semibold tabular-nums text-xactscore-accent dark:font-black">
                    {mobileEnd(row, index)}
                  </div>
                ) : null}
              </>
            )

            if (!details) {
              const rowClass = cn(
                "group flex min-h-11 items-center gap-1.5 px-2.5 py-2 touch-manipulation",
                index % 2 === 1 && "bg-slate-50/80 dark:bg-white/[0.02]",
                href && "active:bg-indigo-50 dark:active:bg-white/[0.06]"
              )
              return (
                <li key={rowKey}>
                  {href ? (
                    <Link href={href} prefetch className={rowClass}>
                      {trigger}
                    </Link>
                  ) : (
                    <div className={rowClass}>{trigger}</div>
                  )}
                </li>
              )
            }

            return (
              <ExpandableRow
                key={rowKey}
                className={cn(index % 2 === 1 && "bg-slate-50/80 dark:bg-white/[0.02]")}
                trigger={trigger}
                content={details}
              />
            )
          })}
        </ul>
      ) : (
        <ul className="space-y-3 md:hidden">
          {rows.map((row, index) => (
            <li
              key={getRowKey(row, index)}
              className="glass-row p-4 transition-all duration-300 active:scale-[0.98]"
            >
              {(mobileTitle || mobileSubtitle) && (
                <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/10">
                  <div className="min-w-0">
                    {mobileTitle ? (
                      <div className="break-words text-sm font-medium leading-snug text-slate-900 [overflow-wrap:anywhere] dark:font-bold dark:text-zinc-100">
                        {mobileTitle(row, index)}
                      </div>
                    ) : null}
                    {mobileSubtitle ? (
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {mobileSubtitle(row, index)}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {mobileColumns.map((col) => (
                  <div key={col.key} className={cn(col.mobilePrimary && "col-span-2 sm:col-span-1")}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[10px] dark:font-bold dark:tracking-wider dark:text-zinc-500">
                      {col.header}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                      {col.cell(row, index)}
                    </div>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="glass-list hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/[0.04] dark:text-[11px] dark:font-black dark:tracking-wider dark:text-zinc-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3 whitespace-nowrap", col.headerClassName)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="group transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.cell(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
