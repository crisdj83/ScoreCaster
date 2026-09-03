'use server'

import { createClient } from '../../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Action 1: Update the Contest Name
export async function updateContestSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const contestId = formData.get('contest_id') as string
  const newName = formData.get('name') as string

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members').select('role').eq('contest_id', contestId).eq('user_id', user.id).single()

  if (membershipError || membership?.role !== 'admin') redirect(`/contests/${contestId}?error=Unauthorized.`)

  const { error: updateError } = await supabase
    .from('contests').update({ name: newName }).eq('id', contestId).select().single()

  if (updateError) redirect(`/contests/${contestId}/edit?error=${updateError.message}`)

  revalidatePath(`/contests/${contestId}`, 'layout')
  revalidatePath('/contests', 'page')
  revalidatePath('/', 'page')
  
  redirect(`/contests/${contestId}/edit?success=Contest name updated successfully.`)
}

// Action 2: Generate a Random Invite Key
export async function generateNewInviteKey(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const contestId = formData.get('contest_id') as string

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members').select('role').eq('contest_id', contestId).eq('user_id', user.id).single()

  if (membershipError || membership?.role !== 'admin') redirect(`/contests/${contestId}?error=Unauthorized.`)

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let newKey = ''
  for (let i = 0; i < 8; i++) newKey += chars.charAt(Math.floor(Math.random() * chars.length))

  const { error: updateError } = await supabase
    .from('contests').update({ contest_key: newKey }).eq('id', contestId).select().single()

  if (updateError) {
    if (updateError.code === '23505') redirect(`/contests/${contestId}/edit?error=Key collision. Try again.`)
    redirect(`/contests/${contestId}/edit?error=${updateError.message}`)
  }

  revalidatePath(`/contests/${contestId}`, 'layout')
  revalidatePath('/contests', 'page')
  revalidatePath('/', 'page')
  
  redirect(`/contests/${contestId}/edit?success=New secure invite key generated!`)
}

// Action 3: Update Scoring Rules
export async function updateScoringSettings(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const contestId = formData.get('contest_id') as string
  const pointsExact = Number(formData.get('points_exact'))
  const pointsClose = Number(formData.get('points_close'))
  const pointsResult = Number(formData.get('points_result'))

  // --- STRICT VALIDATION RULES ---
  if (!Number.isInteger(pointsExact)) {
    redirect(`/contests/${contestId}/edit?error=Exact Score points must be a whole number.`)
  }
  if (!Number.isInteger(pointsResult)) {
    redirect(`/contests/${contestId}/edit?error=Correct Result points must be a whole number.`)
  }
  if ((pointsClose * 2) % 1 !== 0) {
    redirect(`/contests/${contestId}/edit?error=Close Prediction points must be in increments of 0.5.`)
  }
  
  // NEW RULE: 5 Point Cap
  if (pointsExact > 5 || pointsClose > 5 || pointsResult > 5) {
    redirect(`/contests/${contestId}/edit?error=Maximum allowed points for any category is 5.`)
  }
  if (pointsExact < 0 || pointsClose < 0 || pointsResult < 0) {
    redirect(`/contests/${contestId}/edit?error=Points cannot be negative.`)
  }

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members')
    .select('role')
    .eq('contest_id', contestId)
    .eq('user_id', user.id)
    .single()

  if (membershipError || membership?.role !== 'admin') {
    redirect(`/contests/${contestId}?error=Unauthorized. Only admins can edit settings.`)
  }

  const { error: updateError } = await supabase
    .from('contests')
    .update({ 
      points_exact: pointsExact,
      points_close: pointsClose,
      points_result: pointsResult
    })
    .eq('id', contestId)
    .select()
    .single()

  if (updateError) {
    redirect(`/contests/${contestId}/edit?error=${updateError.message}`)
  }

  revalidatePath(`/contests/${contestId}`, 'layout')
  
  redirect(`/contests/${contestId}/edit?success=Scoring system updated successfully.`)
}