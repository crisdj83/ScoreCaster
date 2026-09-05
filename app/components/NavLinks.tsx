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
  Activity,
  CircleDot,
} from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'
import { tabActive, tabBase, tabInactive } from '@/lib/tab-styles'

type NavLinksProps = {
  isAdmin: boolean
  isLoggedIn: boolean
  hasUnreadMessages: boolean
}

export default function NavLinks({ isAdmin, isLoggedIn, hasUnreadMessages }: NavLinksProps) {
  const pathname = usePathname()
  const t = useTranslations()

  const linkClass = (path: string) =>
    cn(tabBase, 'h-10 sm:h-11', pathname === path ? tabActive : tabInactive)

  return (
    <>
      <Link
        href="/"
        aria-label="ScoreCaster home"
        className="inline-flex h-10 items-center gap-2 outline-none sm:h-11"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/80 text-scorecaster-accent backdrop-blur-md">
          <Activity className="h-5 w-5" strokeWidth={3} />
          <CircleDot className="absolute right-1 top-1 h-2.5 w-2.5" fill="currentColor" strokeWidth={2.5} />
        </span>
        <span className="hidden font-black uppercase tracking-tight text-zinc-100 lg:inline">
          ScoreCaster
        </span>
      </Link>
      <Link href="/" className={linkClass('/')}>
        <HomeIcon className="h-4 w-4" />
        {t('Dashboard')}
      </Link>
      <Link href="/contests" className={linkClass('/contests')}>
        <Trophy className="h-4 w-4" /> {t('Contests')}
      </Link>
      <Link href="/profile" className={linkClass('/profile')}>
        <UserIcon className="h-4 w-4" /> {t('Profile')}
      </Link>
      <Link href="/news" className={linkClass('/news')}>
        <span className="relative">
          <MessageSquare className="h-4 w-4" />
          {hasUnreadMessages && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-zinc-900" />
          )}
        </span>
        {t('Messages')}
      </Link>
      <Link href="/help" className={linkClass('/help')}>
        <CircleHelp className="h-4 w-4" /> {t('Help')}
      </Link>
      {isAdmin && (
        <Link href="/admin" className={linkClass('/admin')}>
          <ShieldCheck className="h-4 w-4" /> {t('Admin')}
        </Link>
      )}
      {!isLoggedIn && (
        <Link href="/login" className={linkClass('/login')}>
          <LogIn className="h-4 w-4" /> {t('Sign In')}
        </Link>
      )}
    </>
  )
}
