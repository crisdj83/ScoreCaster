import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:border-orange-400/50 active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:brightness-110",
        secondary:
          "border border-white/10 bg-white/[0.07] text-zinc-100 backdrop-blur-md hover:bg-white/[0.12]",
        outline:
          "border border-white/15 bg-transparent text-zinc-100 backdrop-blur-md hover:bg-white/10",
        ghost: "text-zinc-300 hover:bg-white/10 hover:text-zinc-100",
        destructive:
          "bg-red-500/15 text-red-300 border border-red-500/30 backdrop-blur-md hover:bg-red-500/25",
        link: "text-scorecaster-accent underline-offset-4 hover:underline",
        glass:
          "border border-orange-500/30 bg-orange-500/10 text-orange-200 backdrop-blur-md hover:bg-orange-500/20",
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
