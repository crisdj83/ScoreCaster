import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ContestNav from './ContestNav'
import ContestIcon from '../../components/ContestIcon'
import { getTranslations } from '../../../lib/i18n'
import { getServerLocale } from '../../../lib/i18n-server'
import { Surface } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'

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
    <div className="mx-auto w-full space-y-6 pb-12 pt-2 sm:pt-4">
      <Breadcrumb
        items={[
          { label: t('Contests'), href: '/contests' },
          { label: contest.name },
        ]}
      />

      <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl md:flex-row md:items-center md:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-8 -translate-y-8 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-amber-400/5 blur-3xl" />

        <div className="z-10">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500">
            <span>{t('Official Prediction League')}</span>
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white md:text-5xl">
            <ContestIcon contestId={contest.id} />
            <span className="truncate">{contest.name}</span>
          </h1>
        </div>

        <div className="z-10 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center shadow-inner backdrop-blur-md">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('Invite Code')}</p>
          <p className="bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text font-mono text-2xl font-black tracking-widest text-transparent">{contest.contest_key}</p>
        </div>
      </div>

      <ContestNav contestId={contest.id} isAdmin={isAdmin} />

      <Surface className="min-h-[400px] overflow-hidden p-4 sm:p-6 md:p-8">
        {props.children}
      </Surface>
    </div>
  )
}
