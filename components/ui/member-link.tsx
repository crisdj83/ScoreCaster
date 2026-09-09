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
        'relative z-10 cursor-pointer touch-manipulation text-indigo-700 underline-offset-2 active:opacity-70 dark:text-xactscore-accent',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
