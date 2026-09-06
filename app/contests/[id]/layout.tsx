import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ContestNav from './ContestNav'
import ContestIcon from '../../components/ContestIcon'
import { getTranslations } from '../../../lib/i18n'
import { getServerLocale } from '../../../lib/i18n-server'
import { Surface } from '@/components/ui/card'

export default async function ContestLayout(props: { 
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members')
    .select(`
      role,
      contests (
        id,
        name,
        contest_key,
        admin_id
      )
    `)
    .eq('contest_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    redirect('/contests?error=You do not have access to this contest.')
  }

  const contest = membership.contests as unknown as {
    id: string;
    name: string;
    contest_key: string;
    admin_id: string;
  }
  
  const isAdmin = membership.role === 'admin'

  return (
    <div className="mx-auto w-full space-y-3 pb-12 pt-1 sm:space-y-6 sm:pt-4">
      {/* Mobile: name + invite. Home/Leagues live in the bottom bar. */}
      <div className="flex items-center gap-2 md:hidden">
        <ContestIcon contestId={contest.id} size="sm" />
        <h1 className="min-w-0 flex-1 truncate text-base font-black tracking-tight text-white">
          {contest.name}
        </h1>
        <div className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
            {t('Invite Code')}
          </p>
          <p className="bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text font-mono text-[11px] font-black tracking-wider text-transparent">
            {contest.contest_key}
          </p>
        </div>
      </div>

      {/* Desktop: full contest identity */}
      <div className="relative hidden items-center justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl shadow-black/40 backdrop-blur-xl md:flex md:px-8 md:py-6">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-8 -translate-y-8 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-amber-400/5 blur-3xl" />

        <div className="z-10 min-w-0">
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-zinc-500">
            {t('Official Prediction League')}
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white md:text-4xl">
            <ContestIcon contestId={contest.id} />
            <span className="truncate">{contest.name}</span>
          </h1>
        </div>

        <div className="z-10 shrink-0 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center shadow-inner backdrop-blur-md">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {t('Invite Code')}
          </p>
          <p className="bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text font-mono text-2xl font-black tracking-widest text-transparent">
            {contest.contest_key}
          </p>
        </div>
      </div>

      <ContestNav contestId={contest.id} isAdmin={isAdmin} />

      <Surface className="min-h-[400px] overflow-hidden p-3 sm:p-6 md:p-8">
        {props.children}
      </Surface>
    </div>
  )
}
