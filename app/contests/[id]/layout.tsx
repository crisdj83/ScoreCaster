import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ContestNav from './ContestNav'

export default async function ContestLayout(props: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members')
    .select('role')
    .eq('contest_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    redirect('/contests?error=You do not have access to this contest.')
  }

  const isAdmin = membership.role === 'admin'

  return (
    <div className="mx-auto w-full space-y-2.5 pb-12 pt-1 sm:space-y-6 sm:pt-4">
      <ContestNav contestId={params.id} isAdmin={isAdmin} />

      <div className="content-panel contest-shell min-h-[400px] min-w-0 overflow-x-clip overflow-y-visible p-2.5 sm:overflow-hidden sm:p-6 md:p-8">
        {props.children}
      </div>
    </div>
  )
}
