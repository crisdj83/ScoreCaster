'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, User as UserIcon, Home as HomeIcon, LogIn, Newspaper, ShieldCheck } from 'lucide-react'
import ScoreCasterLogo from './ScoreCasterLogo'

type NavLinksProps = {
  isAdmin: boolean
  isLoggedIn: boolean
  hasUnreadNews: boolean
}

export default function NavLinks({ isAdmin, isLoggedIn, hasUnreadNews }: NavLinksProps) {
  const pathname = usePathname()
  const linkClass = (path: string) => `flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${
    pathname === path
      ? 'border-gray-300 bg-gray-200 text-gray-950 ring-2 ring-gray-300/50'
      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'
  }`

  return (
    <>
      <Link href="/" aria-label="ScoreCaster home" className="mr-2 hidden items-center sm:flex">
        <ScoreCasterLogo compact />
      </Link>
      <Link href="/" className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors ${
        pathname === '/' ? 'bg-gray-950 text-white ring-2 ring-gray-400/50' : 'bg-gray-900 text-white hover:bg-gray-800'
      }`}>
        <HomeIcon className="h-4 w-4" /> Dashboard
      </Link>
      <Link href="/contests" className={linkClass('/contests')}>
        <Trophy className="h-4 w-4" /> Contests
      </Link>
      <Link href="/profile" className={linkClass('/profile')}>
        <UserIcon className="h-4 w-4" /> Profile
      </Link>
      <Link href="/news" className={linkClass('/news')}>
        <span className="relative">
          <Newspaper className="h-4 w-4" />
          {hasUnreadNews && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" />}
        </span>
        News
      </Link>
      {isAdmin && (
        <Link href="/admin" className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${
          pathname === '/admin' ? 'border-purple-300 bg-purple-200 text-purple-950 ring-2 ring-purple-300/50' : 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100'
        }`}>
          <ShieldCheck className="h-4 w-4" /> Admin
        </Link>
      )}
      {!isLoggedIn && (
        <Link href="/login" className={linkClass('/login')}>
          <LogIn className="h-4 w-4" /> Sign In
        </Link>
      )}
    </>
  )
}
