'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export async function completePasswordReset(newPassword: string, confirmPassword: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Invalid or expired code' }
  }

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    return { error: error.message || 'Could not update password' }
  }

  revalidatePath('/', 'layout')
  redirect(`/?success=${encodeURIComponent('Password updated successfully!')}`)
}
