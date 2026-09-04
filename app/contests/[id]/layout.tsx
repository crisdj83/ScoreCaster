import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ContestNav from './ContestNav'
import ContestIcon from '../../components/ContestIcon'
import { getTranslations } from '../../../lib/i18n'
import { getServerLocale } from '../../../lib/i18n-server'

export default async function ContestLayout(props: { 
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()

  // 1. Verify user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // 2. Fetch contest details AND verify the user is a member
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
    <div className="max-w-6xl mx-auto space-y-6 pt-6 pb-12">
      
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        <Link href="/" className="hover:text-gray-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> {t('Dashboard')}
        </Link>
        <span>/</span>
        <Link href="/contests" className="hover:text-gray-900 transition-colors">{t('Contests')}</Link>
        <span>/</span>
        <span className="text-orange-600">{contest.name}</span>
      </div>

      {/* Contest Header - W-Series Gradient Aesthetic */}
      <div className="bg-gradient-to-br from-[#0d0d0d] via-[#242424] to-orange-600 text-white p-6 md:p-10 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-orange-500/50">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="z-10">
          <div className="flex items-center gap-2 text-orange-200 text-xs font-black uppercase tracking-widest mb-2">
            <span>{t('Official Prediction League')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
            <ContestIcon contestId={contest.id} />
            {contest.name}
          </h1>
        </div>
        
        <div className="z-10 bg-black/40 px-5 py-3 rounded-xl border border-white/10 backdrop-blur-md text-center shadow-inner">
          <p className="text-[10px] text-orange-200 uppercase tracking-widest font-black mb-1">{t('Invite Code')}</p>
          <p className="font-mono text-2xl font-black tracking-widest text-[#d4ff00]">{contest.contest_key}</p>
        </div>
      </div>

      {/* Sub-Navigation Tabs - Modern Dark Capsule Bar */}
      <ContestNav contestId={contest.id} isAdmin={isAdmin} />

      {/* Page Content Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 min-h-[400px] overflow-hidden p-6 md:p-8">
        {props.children}
      </div>
    </div>
  )
}