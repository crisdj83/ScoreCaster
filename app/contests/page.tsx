import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ContestHub from './ContestHub'

export default async function ContestsPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // 2. Fetch all contests this user is a member of, along with the contest details
  const { data: myContests } = await supabase
    .from('contest_members')
    .select(`
      contest_id,
      role,
      joined_at,
      contests (
        name,
        contest_key,
        is_open
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  return (
    <ContestHub myContests={myContests || []} messages={searchParams} />
  )
}