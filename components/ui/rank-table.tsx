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
}: RankTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-10 text-center text-sm text-zinc-500 backdrop-blur-xl">
        {emptyMessage}
      </div>
    )
  }

  const mobileColumns = columns.filter((c) => !c.hideOnMobile)
  const expandableColumns = mobileColumns.filter((c) => c.mobileExpandable)
  const compactMode = Boolean(mobileRank || mobileEnd)

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: compact horizontal rows */}
      {compactMode ? (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl md:hidden">
          {rows.map((row, index) => {
            const rowKey = getRowKey(row, index)
            const content =
              expandableColumns.length > 0 ? (
                <>
                  {expandableColumns.map((col) => (
                    <div key={col.key} className="min-w-0">
                      <div className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        {col.header}
                      </div>
                      <div className="truncate text-xs font-semibold text-zinc-200">
                        {col.cell(row, index)}
                      </div>
                    </div>
                  ))}
                </>
              ) : null

            const trigger = (
              <>
                {mobileRank ? (
                  <div className="flex shrink-0 items-center justify-center">
                    {mobileRank(row, index)}
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-zinc-100">
                    {mobileTitle ? mobileTitle(row, index) : null}
                  </div>
                  {mobileSubtitle ? (
                    <div className="truncate text-[11px] text-zinc-500">
                      {mobileSubtitle(row, index)}
                    </div>
                  ) : null}
                </div>

                {mobileEnd ? (
                  <div className="shrink-0 text-right font-black text-scorecaster-accent">
                    {mobileEnd(row, index)}
                  </div>
                ) : null}
              </>
            )

            return <ExpandableRow key={rowKey} trigger={trigger} content={content} />
          })}
        </ul>
      ) : (
        <ul className="space-y-3 md:hidden">
          {rows.map((row, index) => (
            <li
              key={getRowKey(row, index)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 active:scale-[0.98]"
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

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl md:block">
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
