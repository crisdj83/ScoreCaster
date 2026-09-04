'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, BarChart2, BookOpen, Shield, Settings } from 'lucide-react'

export default function ContestNav({ contestId, isAdmin }: { contestId: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const links = [
    { href: `/contests/${contestId}/predictions`, label: 'Predictions', icon: Trophy },
    { href: `/contests/${contestId}/ranking`, label: 'Ranking', icon: BarChart2 },
    { href: `/contests/${contestId}/championship`, label: 'PL Standings', icon: Shield },
    { href: `/contests/${contestId}/rules`, label: 'Rules', icon: BookOpen },
  ]

  return (
    <div className="bg-gray-950 p-2 rounded-2xl shadow-lg flex overflow-x-auto hide-scrollbar gap-1 border border-gray-800">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
              active ? 'bg-[#d4ff00] text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        )
      })}
      {isAdmin && (
        <Link
          href={`/contests/${contestId}/edit`}
          className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ml-auto ${
            pathname === `/contests/${contestId}/edit` ? 'bg-orange-500 text-black' : 'text-orange-300 hover:text-white hover:bg-orange-500/20'
          }`}
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>
      )}
    </div>
  )
}
