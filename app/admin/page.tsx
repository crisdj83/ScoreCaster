// Changed to ../../ to go up two folder levels!
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { redirect } from 'next/navigation'
import { approveAvatar, rejectAvatar } from './actions'
import { ShieldCheck, Check, X, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

type PendingUser = {
  id: string
  username: string | null
  email: string | null
  pending_avatar_url: string
  avatar_url: string | null
}

export default async function AdminDashboard(props: { searchParams: Promise<{ success?: string, error?: string }> }) {
  const searchParams = await props.searchParams;
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()

  // 1. Verify this user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Double-check they are actually the Global Admin
  const { data: currentUser } = await supabase
    .from('users')
    .select('is_global_admin')
    .eq('id', user.id)
    .single()

  if (!currentUser?.is_global_admin) {
    redirect('/?error=Unauthorized. You are not a global admin.')
  }

  // 3. Use the Service Role to fetch all users who are waiting for image approval
  const supabaseAdmin = createAdminClient()

  const { data: pendingUsers } = await supabaseAdmin
    .from('users')
    .select('id, username, email, pending_avatar_url, avatar_url')
    .not('pending_avatar_url', 'is', null)

  return (
    <div className="mx-auto w-full space-y-6 pb-12 pt-6">
      <div>
        <Link
          href="/"
          className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:text-scorecaster-accent"
        >
          <ArrowLeft className="h-4 w-4" /> {t('Back to Dashboard')}
        </Link>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 shrink-0 text-scorecaster-accent" />
          <PageHeader
            className="mb-0"
            title={t('Global Admin Portal')}
            description={t('Review and moderate pending user profile images.')}
          />
        </div>
      </div>

      {searchParams?.success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-300">
          {searchParams.success}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 bg-zinc-950 px-5 py-4 text-xs font-black uppercase tracking-wider text-zinc-100">
          <Clock className="h-4 w-4 text-scorecaster-accent" />
          {t('Pending Image Approvals')} ({pendingUsers?.length || 0})
        </div>

        <CardContent className="p-6 md:p-8">
          {!pendingUsers || pendingUsers.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-zinc-700" />
              <p className="font-bold uppercase tracking-tight text-zinc-300">{t('Queue is empty')}</p>
              <p className="mt-1 text-xs text-zinc-500">All user images have been reviewed successfully.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingUsers.map((u: PendingUser) => (
                <div
                  key={u.id}
                  className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 transition-all hover:border-zinc-700"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="overflow-hidden">
                      <p className="truncate font-extrabold text-zinc-100">{u.username || 'No Username'}</p>
                      <p className="truncate text-xs text-zinc-500">{u.email}</p>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-grow items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <img
                      src={u.pending_avatar_url}
                      alt="Pending Avatar"
                      className="h-28 w-28 rounded-full border-4 border-scorecaster-accent object-cover shadow-md"
                    />
                  </div>

                  <div className="mt-auto flex gap-3">
                    <form action={approveAvatar} className="flex-1">
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="hidden" name="pending_url" value={u.pending_avatar_url} />
                      <Button type="submit" className="w-full uppercase tracking-wider">
                        <Check className="h-4 w-4" /> {t('Approve')}
                      </Button>
                    </form>

                    <form action={rejectAvatar} className="flex-1">
                      <input type="hidden" name="user_id" value={u.id} />
                      <Button type="submit" variant="destructive" className="w-full uppercase tracking-wider">
                        <X className="h-4 w-4" /> {t('Reject')}
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
