import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "focus-frost flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 backdrop-blur-md outline-none ring-0 transition-all duration-300 focus:ring-0 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
