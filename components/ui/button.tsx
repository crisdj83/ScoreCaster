import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-[colors,box-shadow,border-color] outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:border-orange-400/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-scorecaster-accent text-scorecaster-bg hover:bg-[#ff922f]",
        secondary:
          "bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700",
        outline:
          "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800/80",
        ghost: "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
        destructive:
          "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25",
        link: "text-scorecaster-accent underline-offset-4 hover:underline",
        glass:
          "border border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20",
      },
      size: {
        default: "min-h-11 h-11 px-5",
        sm: "min-h-9 h-9 rounded-lg px-3 text-xs",
        lg: "min-h-12 h-12 px-6 text-base",
        icon: "min-h-11 min-w-11 h-11 w-11",
        "icon-sm": "min-h-9 min-w-9 h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
