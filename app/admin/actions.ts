'use server'

// Changed to ../../ to go up two folder levels!
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper function to verify admin status
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminCheck } = await supabase
    .from('users')
    .select('is_global_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_global_admin) {
    redirect('/?error=Unauthorized access.')
  }
}

function getAdminDb() {
  return createAdminClient()
}

export async function approveAvatar(formData: FormData) {
  await verifyAdmin()
  
  const targetUserId = formData.get('user_id') as string
  const pendingUrl = formData.get('pending_url') as string

  const supabaseAdmin = getAdminDb()

  // Move the pending URL to the live URL, and clear the pending column
  await supabaseAdmin
    .from('users')
    .update({ 
      avatar_url: pendingUrl, 
      pending_avatar_url: null 
    })
    .eq('id', targetUserId)

  // Clear cache to update leaderboards across the app
  revalidatePath('/', 'layout')
  redirect('/admin?success=Avatar approved and is now live!')
}

export async function rejectAvatar(formData: FormData) {
  await verifyAdmin()
  
  const targetUserId = formData.get('user_id') as string

  const supabaseAdmin = getAdminDb()

  // Just clear the pending column, leaving their old live avatar (if they had one) intact
  await supabaseAdmin
    .from('users')
    .update({ pending_avatar_url: null })
    .eq('id', targetUserId)

  revalidatePath('/', 'layout')
  redirect('/admin?success=Avatar rejected and deleted.')
}