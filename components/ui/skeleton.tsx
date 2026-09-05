import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-white/[0.06] bg-white/5 backdrop-blur-md",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
