'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, User as UserIcon, Home as HomeIcon, LogIn, MessageSquare, ShieldCheck, CircleHelp, Lightbulb } from 'lucide-react'
import ScoreCasterLogo from './ScoreCasterLogo'
import { useTranslations } from './LocaleProvider'

type NavLinksProps = {
  isAdmin: boolean
  isLoggedIn: boolean
  hasUnreadMessages: boolean
}

export default function NavLinks({ isAdmin, isLoggedIn, hasUnreadMessages }: NavLinksProps) {
  const pathname = usePathname()
  const t = useTranslations()
  const linkClass = (path: string) => `flex items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs ${
    pathname === path
      ? 'border-orange-500 bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/40'
      : 'border-gray-200 bg-white text-gray-800 hover:border-orange-500 hover:bg-gray-50'
  }`

  return (
    <>
      <Link href="/" aria-label="ScoreCaster home" className="mr-2 hidden items-center sm:flex">
        <ScoreCasterLogo compact />
      </Link>
      <Link href="/" className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs ${
        pathname === '/' ? 'bg-orange-500 text-black ring-2 ring-orange-400/50' : 'border border-white/25 bg-white/10 text-orange-100 backdrop-blur-sm hover:border-white/40 hover:bg-white/20'
      }`}>
        <HomeIcon className="h-4 w-4" /> {t('Dashboard')}
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
          {hasUnreadMessages && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" />}
        </span>
        {t('Messages')}
      </Link>
      <Link href="/help" className={linkClass('/help')}>
        <CircleHelp className="h-4 w-4" /> {t('Help')}
      </Link>
      {isLoggedIn && (
        <Link href="/suggestions" className={linkClass('/suggestions')}>
          <Lightbulb className="h-4 w-4" /> {t('Suggestions')}
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin" className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${
          pathname === '/admin' ? 'border-orange-500 bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/40' : 'border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
        }`}>
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
