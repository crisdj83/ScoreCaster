'use server'

import { createClient } from '../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getUserAndAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('is_global_admin').eq('id', user.id).single()
  return { user, isAdmin: profile?.is_global_admin === true }
}

function getServiceDb() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function createNewsPost(formData: FormData) {
  const { user, isAdmin } = await getUserAndAdmin()
  if (!isAdmin) redirect('/news?error=Only global admins can publish news.')
  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()
  if (!title || !body) redirect('/news?error=Title and update text are required.')
  const { error } = await getServiceDb().from('news_posts').insert({ author_id: user.id, title, body })
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function createNewsReply(formData: FormData) {
  const { user } = await getUserAndAdmin()
  const postId = String(formData.get('post_id') || '')
  const body = String(formData.get('body') || '').trim()
  if (!postId || !body) redirect('/news?error=Reply text is required.')
  const { error } = await getServiceDb().from('news_replies').insert({ post_id: postId, author_id: user.id, body })
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
}

export async function deleteNewsPost(formData: FormData) {
  const { isAdmin } = await getUserAndAdmin()
  if (!isAdmin) redirect('/news?error=Only global admins can delete news.')
  const postId = String(formData.get('post_id') || '')
  const { error } = await getServiceDb().from('news_posts').delete().eq('id', postId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function updateNewsReply(formData: FormData) {
  const { user } = await getUserAndAdmin()
  const replyId = String(formData.get('reply_id') || '')
  const body = String(formData.get('body') || '').trim()
  if (!replyId || !body) redirect('/news?error=Reply text is required.')
  const { data: reply } = await getServiceDb().from('news_replies').select('author_id').eq('id', replyId).single()
  if (reply?.author_id !== user.id) redirect('/news?error=You can only edit your own replies.')
  const { error } = await getServiceDb().from('news_replies').update({ body }).eq('id', replyId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function deleteNewsReply(formData: FormData) {
  const { user } = await getUserAndAdmin()
  const replyId = String(formData.get('reply_id') || '')
  const db = getServiceDb()
  const { data: reply } = await db.from('news_replies').select('author_id').eq('id', replyId).single()
  if (reply?.author_id !== user.id) redirect('/news?error=You can only delete your own replies.')
  const { error } = await db.from('news_replies').delete().eq('id', replyId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function markNewsRead() {
  const { user } = await getUserAndAdmin()
  const { error } = await getServiceDb().from('news_reads').upsert({ user_id: user.id, last_read_at: new Date().toISOString() })
  if (error) throw new Error(`Unable to mark news as read: ${error.message}`)
  revalidatePath('/news')
}
