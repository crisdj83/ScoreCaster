import * as React from "react"

import { cn } from "@/lib/utils"

export type RankColumn<T> = {
  key: string
  header: React.ReactNode
  cell: (row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
  /** Hide on mobile card view (still shown in desktop table) */
  hideOnMobile?: boolean
  /** Emphasize in mobile card header */
  mobilePrimary?: boolean
}

type RankTableProps<T> = {
  rows: T[]
  columns: RankColumn<T>[]
  getRowKey: (row: T, index: number) => string
  className?: string
  emptyMessage?: string
  mobileTitle?: (row: T, index: number) => React.ReactNode
  mobileSubtitle?: (row: T, index: number) => React.ReactNode
}

export function RankTable<T>({
  rows,
  columns,
  getRowKey,
  className,
  emptyMessage = "No data yet.",
  mobileTitle,
  mobileSubtitle,
}: RankTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    )
  }

  const mobileColumns = columns.filter((c) => !c.hideOnMobile)

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile stacked cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <li
            key={getRowKey(row, index)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            {(mobileTitle || mobileSubtitle) && (
              <div className="mb-3 flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
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

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/80 text-[11px] font-black uppercase tracking-wider text-zinc-500">
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
          <tbody className="divide-y divide-zinc-800">
            {rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="bg-zinc-900/60 transition-colors hover:bg-zinc-800/40"
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
