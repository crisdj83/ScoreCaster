import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
    <div className="mx-auto w-full space-y-6 pb-12 pt-2 sm:pt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        <Link href="/" className="flex items-center gap-1 transition-colors hover:text-zinc-100">
          <ArrowLeft className="h-3.5 w-3.5" /> {t('Dashboard')}
        </Link>
        <span>/</span>
        <Link href="/contests" className="transition-colors hover:text-zinc-100">{t('Contests')}</Link>
        <span>/</span>
        <span className="text-scorecaster-accent">{contest.name}</span>
      </div>

      <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl border border-orange-500/40 bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-700 p-6 text-white shadow-2xl md:flex-row md:items-center md:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-8 -translate-y-8 rounded-full bg-orange-500/10 blur-3xl" />
        
        <div className="z-10">
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-200">
            <span>{t('Official Prediction League')}</span>
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
            <ContestIcon contestId={contest.id} />
            {contest.name}
          </h1>
        </div>
        
        <div className="z-10 rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-center shadow-inner backdrop-blur-md">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-orange-200">{t('Invite Code')}</p>
          <p className="font-mono text-2xl font-black tracking-widest text-scorecaster-accent">{contest.contest_key}</p>
        </div>
      </div>

      <ContestNav contestId={contest.id} isAdmin={isAdmin} />

      <Surface className="min-h-[400px] overflow-hidden p-4 sm:p-6 md:p-8">
        {props.children}
      </Surface>
    </div>
  )
}
