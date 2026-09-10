'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Profile link with a larger mobile-friendly hit area. */
export function MemberLink({
  href,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        'relative z-10 cursor-pointer touch-manipulation text-slate-800 underline-offset-2 transition-colors hover:text-indigo-700 active:text-indigo-700 focus-visible:text-indigo-700 dark:text-zinc-200 dark:hover:text-xactscore-accent dark:active:text-xactscore-accent dark:focus-visible:text-xactscore-accent',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
