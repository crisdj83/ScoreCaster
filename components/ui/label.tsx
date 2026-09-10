import * as React from "react"

import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<"label">
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:font-bold dark:tracking-wider dark:text-xactscore-muted",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
