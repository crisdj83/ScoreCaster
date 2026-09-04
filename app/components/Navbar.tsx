import { LogOut } from 'lucide-react'
import { createClient } from '../../lib/supabase/server'
import { signOut } from '../actions'
import NavLinks from './NavLinks'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('users').select('is_global_admin').eq('id', user.id).single()
    : { data: null }
  let hasUnreadNews = false
  if (user) {
    const [{ data: latestPost }, { data: latestReply }, { data: readState }] = await Promise.all([
      supabase.from('news_posts').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('news_replies').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('news_reads').select('last_read_at').eq('user_id', user.id).maybeSingle(),
    ])
    const lastRead = readState?.last_read_at ? new Date(readState.last_read_at).getTime() : 0
    hasUnreadNews = [latestPost?.created_at, latestReply?.created_at]
      .some(createdAt => createdAt && new Date(createdAt).getTime() > lastRead)
  }

  return (
    <div className="flex justify-center px-4 pt-5">
      <nav className="flex w-full max-w-5xl flex-wrap items-center justify-center gap-2.5">
        <NavLinks isAdmin={profile?.is_global_admin === true} isLoggedIn={Boolean(user)} hasUnreadNews={hasUnreadNews} />
        {user && (
          <form action={signOut}>
            <button             className="flex items-center gap-2 rounded-full border border-orange-500/50 bg-orange-500/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-orange-300 shadow-sm transition-colors hover:bg-orange-500/20">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </form>
        )}
        <div className="flex items-center gap-2 px-1">
          <a
            href="https://instagram.com/cristiansfariac"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/50 bg-orange-500/10 text-orange-300 shadow-sm transition-all hover:border-orange-400 hover:bg-orange-500/20 hover:text-orange-200"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.75">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.75" className="fill-current stroke-none" />
            </svg>
          </a>
          <a
            href="https://youtube.com/@SyntiX-Dj"
            target="_blank"
            rel="noreferrer"
            aria-label="YouTube"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/50 bg-orange-500/10 text-orange-300 shadow-sm transition-all hover:border-orange-400 hover:bg-orange-500/20 hover:text-orange-200"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.75">
              <rect x="3" y="6" width="18" height="12" rx="3" />
              <path d="m10 9 5 3-5 3z" className="fill-current stroke-none" />
            </svg>
          </a>
        </div>
      </nav>
    </div>
  )
}