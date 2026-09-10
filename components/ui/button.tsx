import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 outline-none ring-0 touch-manipulation [-webkit-tap-highlight-color:transparent] focus:ring-0 focus-visible:ring-0 focus-visible:border-indigo-400/50 dark:focus-visible:border-orange-400/50 active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-amber-500 dark:to-orange-600 dark:shadow-[0_10px_25px_rgba(245,158,11,0.35)] dark:hover:bg-transparent dark:hover:brightness-110",
        secondary:
          "border border-xactscore-border bg-xactscore-surface text-xactscore-text backdrop-blur-md hover:bg-slate-100 dark:hover:bg-amber-500/10",
        outline:
          "border border-xactscore-border bg-transparent text-xactscore-text backdrop-blur-md hover:bg-slate-100 dark:hover:bg-amber-500/10",
        ghost: "text-xactscore-muted hover:bg-slate-100 hover:text-xactscore-text dark:hover:bg-amber-500/10",
        destructive:
          "border border-red-500/30 bg-red-500/15 text-red-700 backdrop-blur-md hover:bg-red-500/25 dark:text-red-300",
        link: "text-indigo-600 underline-offset-4 hover:underline dark:text-xactscore-accent",
        glass:
          "border border-slate-200 bg-slate-100 text-slate-700 backdrop-blur-md hover:bg-slate-200 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-orange-200 dark:hover:bg-amber-500/20",
      },
      size: {
        default: "min-h-11 h-11 px-5",
        sm: "min-h-11 h-11 rounded-lg px-3.5 text-xs",
        lg: "min-h-12 h-12 px-6 text-base",
        icon: "min-h-11 min-w-11 h-11 w-11",
        "icon-sm": "min-h-11 min-w-11 h-11 w-11 rounded-lg",
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
