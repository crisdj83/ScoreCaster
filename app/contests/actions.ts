'use server'

import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { redirect } from 'next/navigation'

// Helper function to generate a 7-character alphanumeric string (e.g., "btyfwtx")
function generateContestKey() {
  return Math.random().toString(36).substring(2, 9).toLowerCase()
}

export async function createContest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) redirect('/login')

  const name = formData.get('name') as string
  const contestKey = generateContestKey()
  const serviceSupabase = createAdminClient()

  // 1. Create the contest
  const { data: newContest, error: contestError } = await serviceSupabase
    .from('contests')
    .insert({
      admin_id: user.id,
      name: name,
      contest_key: contestKey,
      season_length: 'full',
    })
    .select('id')
    .single()

  if (contestError) {
    redirect(`/contests?error=Failed to create contest: ${contestError.message}`)
  }

  // 2. Automatically add the creator as the 'admin' in the members table
  const { error: memberError } = await serviceSupabase
    .from('contest_members')
    .insert({
      contest_id: newContest.id,
      user_id: user.id,
      role: 'admin'
    })

  if (memberError) {
    redirect(`/contests?error=Failed to join your own contest: ${memberError.message}`)
  }

  // Redirect straight to the new contest dashboard!
  redirect(`/contests/${newContest.id}`)
}

export async function joinContest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) redirect('/login')

  const contestKey = formData.get('contest_key') as string

  // 1. Find the contest by its unique key
  const { data: contest, error: searchError } = await supabase
    .from('contests')
    .select('id')
    .eq('contest_key', contestKey.toLowerCase())
    .single()

  if (searchError || !contest) {
    redirect(`/contests?error=Contest not found. Please check the code and try again.`)
  }

  // 2. Add the user as a 'member'
  const { error: joinError } = await supabase
    .from('contest_members')
    .insert({
      contest_id: contest.id,
      user_id: user.id,
      role: 'member'
    })

  // If the error code is 23505, it means they are already in the contest (unique constraint violation)
  if (joinError && joinError.code === '23505') {
    redirect(`/contests/${contest.id}`) // Just send them to it
  } else if (joinError) {
    redirect(`/contests?error=Failed to join contest: ${joinError.message}`)
  }

  redirect(`/contests/${contest.id}`)
}