'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
}

export async function sendPasswordResetCode(email: string) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) {
    return { error: 'Please enter your email address' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${siteUrl()}/forgot-password`,
  })

  if (error) {
    return { error: error.message || 'Could not send reset code' }
  }

  return { ok: true as const }
}

export async function verifyPasswordResetCode(email: string, token: string) {
  const trimmedEmail = email.trim().toLowerCase()
  const code = token.replace(/\s+/g, '')
  if (!trimmedEmail || !code) {
    return { error: 'Invalid or expired code' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email: trimmedEmail,
    token: code,
    type: 'recovery',
  })

  if (error) {
    return { error: error.message || 'Invalid or expired code' }
  }

  return { ok: true as const }
}

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
