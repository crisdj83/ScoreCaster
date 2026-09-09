import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ContestNav from './ContestNav'
import ContestIcon from '../../components/ContestIcon'
import { getTranslations } from '../../../lib/i18n'
import { getServerLocale } from '../../../lib/i18n-server'
import { Globe } from 'lucide-react'
import CopyInviteButton from '../../components/CopyInviteButton'
import { inviteUrl } from '../../../lib/urls'

type ContestRow = {
  id: string
  name: string
  contest_key: string
  admin_id: string
  is_public?: boolean
}

function asContest(value: unknown): ContestRow | null {
  const row = Array.isArray(value) ? value[0] : value
  if (!row || typeof row !== 'object') return null
  const contest = row as Partial<ContestRow>
  if (!contest.id || !contest.name || !contest.contest_key) return null
  return {
    id: String(contest.id),
    name: String(contest.name),
    contest_key: String(contest.contest_key),
    admin_id: String(contest.admin_id || ''),
    is_public: Boolean(contest.is_public),
  }
}

export default async function ContestLayout(props: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members')
    .select(
      `
      role,
      contests (
        id,
        name,
        contest_key,
        admin_id,
        is_public
      )
    `
    )
    .eq('contest_id', params.id)
    .eq('user_id', user.id)
    .single()

  const contest = asContest(membership?.contests)
  if (membershipError || !membership || !contest) {
    redirect('/contests?error=You do not have access to this contest.')
  }

  const isAdmin = membership.role === 'admin'

  return (
    <div className="mx-auto w-full space-y-3 pb-12 pt-1 sm:space-y-6 sm:pt-4">
      {/* Mobile: name + invite. Home/Leagues live in the bottom bar. */}
      <div className="flex items-center gap-2 md:hidden">
        <ContestIcon contestId={contest.id} size="sm" />
        <h1 className="min-w-0 flex-1 truncate text-base font-black tracking-tight text-zinc-900 dark:text-white">
          {contest.name}
        </h1>
        {contest.is_public ? (
          <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{t('Public')}</p>
            <p className="inline-flex items-center justify-center gap-1 font-mono text-[11px] font-black tracking-wider text-orange-300">
              <Globe className="h-3 w-3" />
              {t('Open')}
            </p>
          </div>
        ) : (
          <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{t('Invite Code')}</p>
            <p className="bg-clip-text font-mono text-[11px] font-black tracking-wider text-zinc-900 dark:bg-gradient-to-r dark:from-amber-400 dark:to-orange-600 dark:text-transparent">
              {contest.contest_key}
            </p>
            <CopyInviteButton url={inviteUrl(contest.contest_key)} className="mt-1 min-h-8 w-full px-2 text-[9px]" />
          </div>
        )}
      </div>

      {/* Desktop: full contest identity */}
      <div className="relative hidden items-center justify-between gap-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/5 dark:shadow-2xl dark:shadow-black/40 md:flex md:px-8 md:py-6">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-8 -translate-y-8 rounded-full bg-slate-200/50 blur-3xl dark:bg-orange-500/10" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-slate-100/80 blur-3xl dark:bg-amber-400/5" />

        <div className="z-10 min-w-0">
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-zinc-500">
            {t('Official Prediction League')}
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-white md:text-4xl">
            <ContestIcon contestId={contest.id} />
            <span className="truncate">{contest.name}</span>
          </h1>
        </div>

        {contest.is_public ? (
          <div className="z-10 shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-3 text-center shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-inner">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('Public')}</p>
            <p className="inline-flex items-center justify-center gap-1.5 font-mono text-2xl font-black tracking-widest text-orange-300">
              <Globe className="h-6 w-6" />
              {t('Open')}
            </p>
          </div>
        ) : (
          <div className="z-10 shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-3 text-center shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-inner">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('Invite Code')}</p>
            <p className="bg-clip-text font-mono text-2xl font-black tracking-widest text-zinc-900 dark:bg-gradient-to-r dark:from-amber-400 dark:to-orange-600 dark:text-transparent">
              {contest.contest_key}
            </p>
            <CopyInviteButton url={inviteUrl(contest.contest_key)} className="mt-3 w-full" />
          </div>
        )}
      </div>

      <ContestNav contestId={contest.id} isAdmin={isAdmin} />

      <div className="min-h-[400px] min-w-0 overflow-hidden rounded-3xl bg-white p-3 shadow-xl shadow-slate-200/50 dark:bg-[var(--glass-bg)] dark:shadow-[var(--glass-shadow)] sm:p-6 md:p-8">
        {props.children}
      </div>
    </div>
  )
}
