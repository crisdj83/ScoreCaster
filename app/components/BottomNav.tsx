'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Trophy,
  User as UserIcon,
  Home as HomeIcon,
  LogIn,
  MessageSquare,
  ShieldCheck,
  CircleHelp,
} from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'
import { iosTabItem } from '@/lib/tab-styles'

type BottomNavProps = {
  isAdmin: boolean
  isLoggedIn: boolean
  hasUnreadMessages: boolean
}

/**
 * iOS-style frosted glass bottom tab bar, shown only on mobile/tablet
 * viewports (hidden at the `lg` breakpoint where the top nav takes over).
 */
export default function BottomNav({ isAdmin, isLoggedIn, hasUnreadMessages }: BottomNavProps) {
  const pathname = usePathname()
  const t = useTranslations()

  const items = [
    { href: '/', label: t('Dashboard'), icon: HomeIcon },
    { href: '/contests', label: t('Contests'), icon: Trophy },
    { href: '/profile', label: t('Profile'), icon: UserIcon },
    { href: '/news', label: t('Messages'), icon: MessageSquare, dot: hasUnreadMessages },
    { href: '/help', label: t('Help'), icon: CircleHelp },
    ...(isAdmin ? [{ href: '/admin', label: t('Admin'), icon: ShieldCheck }] : []),
    ...(!isLoggedIn ? [{ href: '/login', label: t('Sign In'), icon: LogIn }] : []),
  ]

  return (
    <nav
      aria-label="Primary"
      className="ios-tab-bar fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-2xl items-stretch gap-1 px-2 py-2">
        {items.map(({ href, label, icon: Icon, dot }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                iosTabItem,
                active ? 'ios-tab-item-active text-orange-200' : 'text-zinc-400 hover:text-zinc-100'
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {dot ? (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-zinc-950/70" />
                ) : null}
              </span>
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
