'use server'

import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { redirect } from 'next/navigation'
import { isValidSeasonLength, type ContestSeasonLength } from '../../lib/contest-season'

// Helper function to generate a 7-character alphanumeric string (e.g., "btyfwtx")
function generateContestKey() {
  return Math.random().toString(36).substring(2, 9).toLowerCase()
}

function escapeIlikeExact(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function createContestError(message: string, extras?: { name?: string; seasonLength?: string; visibility?: 'public' | 'private' }): never {
  const params = new URLSearchParams()
  params.set('error', message)
  params.set('tab', 'create')
  if (extras?.name) params.set('name', extras.name)
  if (extras?.seasonLength) params.set('season_length', extras.seasonLength)
  if (extras?.visibility) params.set('visibility', extras.visibility)
  redirect(`/contests?${params.toString()}`)
}

export async function createContest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) redirect('/login')

  const name = String(formData.get('name') || '').trim()
  if (!name) {
    createContestError('Please enter a contest name.')
  }

  const isPublic = formData.get('visibility') === 'public'
  const requestedLength = String(formData.get('season_length') || 'full')
  const seasonLength: ContestSeasonLength = isValidSeasonLength(requestedLength)
    ? requestedLength
    : 'full'
  const contestKey = generateContestKey()
  const serviceSupabase = createAdminClient()

  if (isPublic) {
    const { data: existingPublic, error: existingError } = await serviceSupabase
      .from('contests')
      .select('id')
      .eq('is_public', true)
      .ilike('name', escapeIlikeExact(name))
      .limit(1)
      .maybeSingle()

    if (!existingError && existingPublic) {
      createContestError(
        'A public league with this name already exists. Please choose another name.',
        { name, seasonLength, visibility: isPublic ? 'public' : 'private' }
      )
    }
  }

  // 1. Create the contest
  const { data: newContest, error: contestError } = await serviceSupabase
    .from('contests')
    .insert({
      admin_id: user.id,
      name,
      contest_key: contestKey,
      season_length: seasonLength,
      is_public: isPublic,
    })
    .select('id')
    .single()

  if (contestError || !newContest) {
    const missingPublicColumn = /is_public/.test(contestError?.message || '')
    createContestError(
      missingPublicColumn
        ? 'Public contests need a one-time database update. Paste supabase/public-contests.sql into the Supabase SQL editor, then try again.'
        : `Failed to create contest: ${contestError?.message || 'Contest was not created.'}`,
      { name, seasonLength, visibility: isPublic ? 'public' : 'private' }
    )
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
    createContestError(`Failed to join your own contest: ${memberError.message}`, {
      name,
      seasonLength,
      visibility: isPublic ? 'public' : 'private',
    })
  }

  // Redirect straight to the new contest dashboard!
  redirect(`/contests/${newContest.id}`)
}

export async function joinContest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) redirect('/login')

  const contestKey = String(formData.get('contest_key') || '').trim().toLowerCase()
  if (!contestKey) {
    redirect('/contests?error=Please enter an invitation key.')
  }

  // 1. Find the private contest by its unique key
  const { data: contest, error: searchError } = await supabase
    .from('contests')
    .select('id')
    .eq('contest_key', contestKey)
    .maybeSingle()

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

export async function joinPublicContest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const contestId = String(formData.get('contest_id') || '')
  if (!contestId) {
    redirect('/contests/public?error=Contest not found.')
  }

  const { data: contest, error: searchError } = await supabase
    .from('contests')
    .select('id, is_public')
    .eq('id', contestId)
    .maybeSingle()

  if (searchError || !contest || !contest.is_public) {
    redirect('/contests/public?error=This public contest could not be found.')
  }

  const { error: joinError } = await supabase
    .from('contest_members')
    .insert({
      contest_id: contest.id,
      user_id: user.id,
      role: 'member',
    })

  if (joinError && joinError.code === '23505') {
    redirect(`/contests/${contest.id}`)
  } else if (joinError) {
    redirect(`/contests/public?error=Failed to join contest: ${joinError.message}`)
  }

  redirect(`/contests/${contest.id}`)
}