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
import XactScoreLogo from './XactScoreLogo'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { tabActive, tabBase, tabInactive } from '@/lib/tab-styles'

type NavLinksProps = {
  isAdmin: boolean
  isLoggedIn: boolean
  unreadMessageCount: number
}

export default function NavLinks({ isAdmin, isLoggedIn, unreadMessageCount }: NavLinksProps) {
  const pathname = usePathname()
  const t = useTranslations()

  const linkClass = (path: string) =>
    cn(tabBase, 'hidden h-10 sm:h-11 lg:inline-flex', pathname === path ? tabActive : tabInactive)

  return (
    <>
      <Link
        href="/"
        aria-label="XactScore home"
        className="inline-flex items-center outline-none"
      >
        <XactScoreLogo compact />
      </Link>
      <Link href="/" className={linkClass('/')}>
        <HomeIcon className="h-4 w-4" />
        {t('Dashboard')}
      </Link>
      {isLoggedIn ? (
        <>
          <Link href="/contests" className={linkClass('/contests')}>
            <Trophy className="h-4 w-4" /> {t('Contests')}
          </Link>
          <Link href="/profile" className={linkClass('/profile')}>
            <UserIcon className="h-4 w-4" /> {t('Profile')}
          </Link>
          <Link href="/news" className={linkClass('/news')}>
            <span className="relative">
              <MessageSquare className="h-4 w-4" />
              {unreadMessageCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-zinc-900">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </span>
            {t('Messages')}
          </Link>
        </>
      ) : null}
      <Link href="/help" className={linkClass('/help')}>
        <CircleHelp className="h-4 w-4" /> {t('Help')}
      </Link>
      {!isLoggedIn && (
        <Link href="/compare" className={linkClass('/compare')}>
          {t('Compare')}
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin" className={linkClass('/admin')}>
          <ShieldCheck className="h-4 w-4" /> {t('Admin')}
        </Link>
      )}
      {!isLoggedIn && (
        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'hidden uppercase tracking-wider lg:inline-flex',
            pathname === '/login' && 'brightness-110'
          )}
        >
          <LogIn className="h-4 w-4" /> {t('Start for free')}
        </Link>
      )}
    </>
  )
}
