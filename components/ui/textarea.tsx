import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "focus-frost flex min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 transition-[border-color,box-shadow] focus:ring-0 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
