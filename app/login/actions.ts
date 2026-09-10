'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { loginPath, safeNextPath } from '../../lib/urls'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const next = safeNextPath(String(formData.get('next') || ''))

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(loginPath({ next, message: error.message }))
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const next = safeNextPath(String(formData.get('next') || ''))

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(loginPath({ mode: 'signup', next, message: error.message }))
  }

  revalidatePath('/', 'layout')
  redirect(next)
}