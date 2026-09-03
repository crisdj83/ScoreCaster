'use client'

import Link from 'next/link'
import { Bell, HelpCircle, Mail, LogOut } from 'lucide-react'

export default function Navbar() {
  return (
    <div className="sticky top-4 z-50 flex justify-center px-4">
      <nav className="bg-gray-950 text-white shadow-2xl rounded-full border border-gray-800 px-6 py-3 flex items-center justify-between gap-8 backdrop-blur-md bg-opacity-90 max-w-4xl w-full">
        
        {/* Left: Home Navigation link */}
        <Link href="/" className="font-black text-xs uppercase tracking-widest text-gray-300 hover:text-orange-400 transition-colors">
          Home
        </Link>

        {/* Center/Right: Actions & Sign Out */}
        <div className="flex items-center space-x-5">
          <div className="relative cursor-pointer text-gray-400 hover:text-white transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center shadow">
              3
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-3 text-gray-400">
            <Link href="/help" className="hover:text-white transition-colors"><HelpCircle className="h-4 w-4" /></Link>
            <Link href="/contact" className="hover:text-white transition-colors"><Mail className="h-4 w-4" /></Link>
          </div>

          <Link href="/logout" className="flex items-center space-x-1.5 bg-red-950/60 hover:bg-red-900 text-red-200 px-3.5 py-1.5 rounded-full transition-all shadow-sm border border-red-800/50">
            <LogOut className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[11px] font-black uppercase tracking-wider hidden sm:block">Sign Out</span>
          </Link>
        </div>

      </nav>
    </div>
  )
}