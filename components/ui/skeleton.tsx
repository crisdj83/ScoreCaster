import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-zinc-200/80 bg-black/5 backdrop-blur-md dark:border-white/[0.06] dark:bg-white/5",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
