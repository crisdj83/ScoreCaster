import * as React from "react"

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
  /** One-line mobile rows; extra stats open in a dropdown when present */
  mobileSingleLine?: boolean
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
  mobileSingleLine = false,
}: RankTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="glass-row px-4 py-10 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    )
  }

  const mobileColumns = columns.filter((c) => !c.hideOnMobile)
  const expandableColumns = mobileColumns.filter((c) => c.mobileExpandable)
  const compactMode = Boolean(mobileRank || mobileEnd)
  const showInlineSubtitle = !mobileSingleLine && Boolean(mobileSubtitle)

  return (
    <div className={cn("w-full", className)}>
      {compactMode ? (
        <ul className="glass-list divide-y divide-white/[0.06] overflow-hidden md:hidden">
          {rows.map((row, index) => {
            const rowKey = getRowKey(row, index)
            const subtitle =
              mobileSingleLine && mobileSubtitle ? mobileSubtitle(row, index) : null
            const details =
              expandableColumns.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {subtitle ? (
                    <div className="col-span-full truncate text-[11px] italic text-scorecaster-accent">
                      {subtitle}
                    </div>
                  ) : null}
                  {expandableColumns.map((col) => (
                    <div
                      key={col.key}
                      className="min-w-0 rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5"
                    >
                      <div className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        {col.mobileHeader ?? col.header}
                      </div>
                      <div className="truncate text-xs font-bold tabular-nums text-zinc-100">
                        {col.cell(row, index)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null

            const trigger = (
              <>
                {mobileRank ? (
                  <div className="flex w-6 shrink-0 items-center justify-center tabular-nums">
                    {mobileRank(row, index)}
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold leading-none tracking-tight text-zinc-100">
                    {mobileTitle ? mobileTitle(row, index) : null}
                  </div>
                  {showInlineSubtitle ? (
                    <div className="mt-0.5 truncate text-[11px] leading-tight text-zinc-500">
                      {mobileSubtitle!(row, index)}
                    </div>
                  ) : null}
                </div>

                {mobileEnd ? (
                  <div className="shrink-0 text-right font-black tabular-nums text-scorecaster-accent">
                    {mobileEnd(row, index)}
                  </div>
                ) : null}
              </>
            )

            return (
              <ExpandableRow
                key={rowKey}
                className={cn(index % 2 === 1 && "bg-white/[0.02]")}
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
                <div className="mb-3 flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="min-w-0">
                    {mobileTitle ? (
                      <div className="truncate font-bold text-zinc-100">
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
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {col.header}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-zinc-100">
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
          <thead className="bg-white/[0.04] text-[11px] font-black uppercase tracking-wider text-zinc-500">
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
          <tbody className="divide-y divide-white/10">
            {rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="transition-colors duration-300 hover:bg-white/[0.06]"
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
