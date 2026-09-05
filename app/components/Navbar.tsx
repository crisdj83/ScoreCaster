import { LogOut } from 'lucide-react'
import { createClient } from '../../lib/supabase/server'
import { signOut } from '../actions'
import NavLinks from './NavLinks'
import LanguageSwitcher from './LanguageSwitcher'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { cn } from '@/lib/utils'
import { tabActive } from '@/lib/tab-styles'

export default async function Navbar() {
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let hasUnreadMessages = false
  let isAdmin = false
  if (user) {
    const { data: memberships } = await supabase.from('contest_members').select('contest_id').eq('user_id', user.id)
    const contestIds = (memberships || []).map(membership => membership.contest_id)
    const [{ data: profile }, { data: latestMessage }, { data: latestReply }, { data: messageReadState }] = await Promise.all([
      supabase.from('users').select('is_global_admin').eq('id', user.id).single(),
      contestIds.length
        ? supabase.from('messages').select('created_at').in('contest_id', contestIds).order('created_at', { ascending: false }).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
      contestIds.length
        ? supabase.from('message_replies').select('created_at, messages!inner(contest_id)').in('messages.contest_id', contestIds).order('created_at', { ascending: false }).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('message_reads').select('last_read_at').eq('user_id', user.id).maybeSingle(),
    ])
    isAdmin = profile?.is_global_admin === true
    const lastRead = messageReadState?.last_read_at ? new Date(messageReadState.last_read_at).getTime() : 0
    hasUnreadMessages = [latestMessage?.created_at, latestReply?.created_at]
      .some(createdAt => createdAt && new Date(createdAt).getTime() > lastRead)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/60 bg-scorecaster-bg/95 backdrop-blur-md">
      <div className="flex w-full flex-wrap items-center gap-2 px-3 py-3 sm:gap-2.5 sm:px-5 lg:px-8 xl:px-10">
        <NavLinks isAdmin={isAdmin} isLoggedIn={Boolean(user)} hasUnreadMessages={hasUnreadMessages} />

        <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          {user ? (
            <form action={signOut} className="inline-flex">
              <button
                type="submit"
                title={t('Sign Out')}
                aria-label={t('Sign Out')}
                className={cn(
                  tabActive,
                  'inline-flex h-10 w-10 items-center justify-center rounded-full outline-none transition-colors hover:bg-white/15 sm:h-11 sm:w-11'
                )}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  )
}
