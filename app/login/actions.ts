'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { safeNextPath } from '../../lib/urls'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const next = safeNextPath(String(formData.get('next') || ''))

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    const params = new URLSearchParams({ message: error.message })
    if (next !== '/') params.set('next', next)
    redirect(`/login?${params.toString()}`)
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
    const params = new URLSearchParams({ message: error.message })
    if (next !== '/') params.set('next', next)
    redirect(`/login?${params.toString()}`)
  }

  revalidatePath('/', 'layout')
  redirect(next)
}