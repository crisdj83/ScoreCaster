'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username = formData.get('username') as string
  const favoriteTeam = formData.get('favorite_team') as string
  const newAvatarUrl = formData.get('avatar_url') as string
  const quote = String(formData.get('quote') || '').trim().slice(0, 18)

  // Fetch their current approved avatar to see if they are trying to change it
  const { data: currentUser } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  // Base update payload with just the text fields
  const updatePayload: any = { 
    username, 
    favorite_team: favoriteTeam,
    quote,
  }

  let message = 'Profile updated successfully!'

  // If they submitted a URL that is different from their current approved avatar, push it to pending
  if (newAvatarUrl && newAvatarUrl !== currentUser?.avatar_url) {
    updatePayload.pending_avatar_url = newAvatarUrl
    message = 'Profile updated! Your new picture is pending admin approval.'
  } else if (!newAvatarUrl) {
    // If they cleared the box, we can just delete the avatars immediately
    updatePayload.avatar_url = null
    updatePayload.pending_avatar_url = null
  }

  // Update the database
  const { error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) {
    redirect(`/profile?error=${error.message}`)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/contests', 'layout')
  
  // REDIRECT TO HOME PAGE INSTEAD OF PROFILE
  redirect(`/?success=${encodeURIComponent(message)}`)
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const currentPassword = String(formData.get('current_password') || '')
  const newPassword = String(formData.get('new_password') || '')
  const confirmPassword = String(formData.get('confirm_password') || '')

  const fail = (message: string) => {
    redirect(`/profile?error=${encodeURIComponent(message)}`)
  }

  if (newPassword.length < 6) {
    fail('Password must be at least 6 characters.')
  }
  if (newPassword !== confirmPassword) {
    fail('New passwords do not match')
  }
  if (currentPassword === newPassword) {
    fail('New password must be different from your current password')
  }

  const { error: currentError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (currentError) {
    fail('Current password is incorrect')
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    fail(error.message || 'Could not update password')
  }

  revalidatePath('/profile')
  redirect(`/profile?success=${encodeURIComponent('Password updated successfully!')}`)
}