import { LogOut } from 'lucide-react'
import { createClient } from '../../lib/supabase/server'
import { signOut } from '../actions'
import NavLinks from './NavLinks'
import BottomNav from './BottomNav'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import InstallPwaBar from './InstallPwaBar'
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
      <header className="sticky top-0 z-40 w-full overflow-visible bg-transparent px-3 pt-[max(0.5rem,env(safe-area-inset-top))] dark:border-b dark:border-xactscore-border dark:bg-xactscore-bg/70 dark:px-0 dark:pt-[env(safe-area-inset-top)]">
        <div className="app-topbar flex w-full min-w-0 flex-nowrap items-center gap-1 overflow-visible rounded-2xl border border-slate-200 bg-white py-1.5 pl-2.5 pr-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:rounded-none dark:border-0 dark:bg-transparent dark:px-3 dark:py-3 dark:shadow-none sm:gap-2.5 sm:rounded-full sm:px-5 sm:py-2 lg:px-8 xl:px-10">
          <NavLinks isAdmin={isAdmin} isLoggedIn={Boolean(user)} unreadMessageCount={unreadMessageCount} />

          <div className="app-topbar-actions ml-auto flex shrink-0 flex-nowrap items-center gap-0.5 sm:gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {user ? (
              <form action={signOut} className="inline-flex shrink-0">
                <button
                  type="submit"
                  title={t('Sign Out')}
                  aria-label={t('Sign Out')}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-xactscore-border bg-xactscore-surface text-xactscore-text shadow-sm outline-none transition-all duration-300 hover:border-slate-200 hover:bg-slate-100 active:scale-90 sm:h-11 sm:w-11 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-orange-200 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/20"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.25} aria-hidden />
                </button>
              </form>
            ) : null}
          </div>
        </div>
        <InstallPwaBar />
      </header>
      <BottomNav isAdmin={isAdmin} isLoggedIn={Boolean(user)} unreadMessageCount={unreadMessageCount} />
    </>
  )
}
