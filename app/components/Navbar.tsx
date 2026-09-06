import { LogOut } from 'lucide-react'
import { createClient } from '../../lib/supabase/server'
import { signOut } from '../actions'
import NavLinks from './NavLinks'
import BottomNav from './BottomNav'
import LanguageSwitcher from './LanguageSwitcher'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'

export default async function Navbar() {
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let unreadMessageCount = 0
  let isAdmin = false
  if (user) {
    const { data: memberships } = await supabase.from('contest_members').select('contest_id').eq('user_id', user.id)
    const contestIds = (memberships || []).map(membership => membership.contest_id)
    const [{ data: profile }, { data: messageReadState }] = await Promise.all([
      supabase.from('users').select('is_global_admin').eq('id', user.id).single(),
      supabase.from('message_reads').select('last_read_at').eq('user_id', user.id).maybeSingle(),
    ])
    isAdmin = profile?.is_global_admin === true
    const lastRead = messageReadState?.last_read_at || '1970-01-01T00:00:00.000Z'

    const [{ count: newMessageCount }, { count: newReplyCount }] = await Promise.all([
      contestIds.length
        ? supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('contest_id', contestIds)
          .gt('created_at', lastRead)
        : Promise.resolve({ count: 0 }),
      contestIds.length
        ? supabase
          .from('message_replies')
          .select('id, messages!inner(contest_id)', { count: 'exact', head: true })
          .in('messages.contest_id', contestIds)
          .gt('created_at', lastRead)
        : Promise.resolve({ count: 0 }),
    ])
    unreadMessageCount = (newMessageCount || 0) + (newReplyCount || 0)
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-xactscore-bg/70 backdrop-blur-xl">
        <div className="flex w-full flex-wrap items-center gap-2 px-3 py-3 sm:gap-2.5 sm:px-5 lg:px-8 xl:px-10">
          <NavLinks isAdmin={isAdmin} isLoggedIn={Boolean(user)} unreadMessageCount={unreadMessageCount} />

          <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            {user ? (
              <form action={signOut} className="inline-flex">
                <button
                  type="submit"
                  title={t('Sign Out')}
                  aria-label={t('Sign Out')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-200 shadow-sm backdrop-blur-md outline-none transition-all duration-300 hover:bg-orange-500/20 active:scale-90 sm:h-11 sm:w-11"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </header>
      <BottomNav isAdmin={isAdmin} isLoggedIn={Boolean(user)} unreadMessageCount={unreadMessageCount} />
    </>
  )
}

