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
  unreadMessageCount: number
}

/**
 * iOS-style frosted glass bottom tab bar, shown only on mobile/tablet
 * viewports (hidden at the `lg` breakpoint where the top nav takes over).
 */
export default function BottomNav({ isAdmin, isLoggedIn, unreadMessageCount }: BottomNavProps) {
  const pathname = usePathname()
  const t = useTranslations()

  const items = [
    { href: '/', label: t('Dashboard'), short: t('Home'), icon: HomeIcon },
    { href: '/contests', label: t('Contests'), short: t('Leagues'), icon: Trophy },
    { href: '/profile', label: t('Profile'), short: t('Profile'), icon: UserIcon },
    { href: '/news', label: t('Messages'), short: t('Messages'), icon: MessageSquare, badge: unreadMessageCount },
    { href: '/help', label: t('Help'), short: t('Help'), icon: CircleHelp },
    ...(isAdmin ? [{ href: '/admin', label: t('Admin'), short: t('Admin'), icon: ShieldCheck }] : []),
    ...(!isLoggedIn ? [{ href: '/login', label: t('Sign In'), short: t('Sign In'), icon: LogIn }] : []),
  ]

  return (
    <nav
      aria-label="Primary"
      className="ios-tab-bar fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-2xl items-stretch gap-0.5 px-1 py-2 sm:gap-1 sm:px-2">
        {items.map(({ href, label, short, icon: Icon, badge }) => {
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
                {badge ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-zinc-950/70">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </span>
              <span className="truncate">{short}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
