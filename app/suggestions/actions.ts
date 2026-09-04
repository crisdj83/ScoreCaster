'use server'

import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createSuggestion(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()

  if (!title || !description) {
    redirect('/suggestions?error=Please%20add%20a%20title%20and%20description.')
  }

  if (title.length > 120 || description.length > 2000) {
    redirect('/suggestions?error=Your%20suggestion%20is%20too%20long.')
  }

  const { error } = await supabase.from('suggestions').insert({
    user_id: user.id,
    title,
    description,
  })

  if (error) redirect(`/suggestions?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/suggestions')
  redirect('/suggestions?success=Suggestion%20submitted.')
}
