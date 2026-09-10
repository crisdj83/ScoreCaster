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
  GitCompare,
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
  const pathname = usePathname() || ''
  const t = useTranslations()

  const items = isLoggedIn
    ? [
        { href: '/', label: t('Dashboard'), short: t('Home'), icon: HomeIcon },
        { href: '/contests', label: t('Contests'), short: t('Leagues'), icon: Trophy },
        { href: '/profile', label: t('Profile'), short: t('Profile'), icon: UserIcon },
        { href: '/news', label: t('Messages'), short: t('Messages'), icon: MessageSquare, badge: unreadMessageCount },
        { href: '/help', label: t('Help'), short: t('Help'), icon: CircleHelp },
        ...(isAdmin ? [{ href: '/admin', label: t('Admin'), short: t('Admin'), icon: ShieldCheck }] : []),
      ]
    : [
        { href: '/', label: t('Dashboard'), short: t('Home'), icon: HomeIcon },
        { href: '/compare', label: t('Compare'), short: t('Compare'), icon: GitCompare },
        { href: '/help', label: t('Help'), short: t('Help'), icon: CircleHelp },
        { href: '/login', label: t('Sign In'), short: t('Sign In'), icon: LogIn },
      ]

  return (
    <nav
      aria-label="Primary"
      className="ios-tab-bar fixed bottom-0 left-0 z-50 w-full bg-white pb-[env(safe-area-inset-bottom)] dark:bg-zinc-900 lg:hidden"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-0.5 overflow-visible px-1 py-0.5 sm:gap-1 sm:px-2">
        {items.map(({ href, label, short, icon: Icon, badge }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                iosTabItem,
                active ? 'ios-tab-item-active text-indigo-600 dark:text-orange-200' : 'text-xactscore-muted hover:text-xactscore-text'
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {badge ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-zinc-950/70">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate leading-tight">{short}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
