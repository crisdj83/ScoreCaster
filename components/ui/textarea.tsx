import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "focus-frost flex min-h-28 w-full rounded-xl border-0 bg-slate-100 px-4 py-3 text-base text-xactscore-text placeholder:text-xactscore-muted backdrop-blur-md outline-none ring-0 transition-all duration-300 focus:ring-0 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border dark:border-xactscore-border dark:bg-xactscore-surface",
      className
    )}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
