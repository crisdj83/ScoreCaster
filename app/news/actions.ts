'use server'

import { createClient } from '../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const OWNER_EMAIL = 'cris.the.dj@gmail.com'

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

async function getMessageAccess(messageId: string, userId: string) {
  const db = getServiceDb()
  const [{ data: message }, { data: membership }] = await Promise.all([
    db.from('messages').select('contest_id, author_id').eq('id', messageId).maybeSingle(),
    db.from('contest_members').select('contest_id, role').eq('user_id', userId),
  ])
  const member = membership?.find(item => item.contest_id === message?.contest_id)
  return {
    message,
    isMember: Boolean(member),
    isContestAdmin: member?.role === 'admin',
  }
}

async function requireMessageMember(contestId: string, userId: string) {
  const { data: membership } = await getServiceDb()
    .from('contest_members')
    .select('role')
    .eq('contest_id', contestId)
    .eq('user_id', userId)
    .maybeSingle()
  return membership
}

export async function createMessage(formData: FormData) {
  const { user } = await getUserAndAdmin()
  const contestId = String(formData.get('contest_id') || '')
  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()
  if (!contestId || !title || !body) redirect('/news?error=Message title and text are required.')
  if (!(await requireMessageMember(contestId, user.id))) {
    redirect('/news?error=You can only post messages in contests you belong to.')
  }
  const { error } = await getServiceDb().from('messages').insert({
    contest_id: contestId,
    author_id: user.id,
    title,
    body,
  })
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function updateMessage(formData: FormData) {
  const { user } = await getUserAndAdmin()
  const messageId = String(formData.get('message_id') || '')
  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()
  if (!messageId || !title || !body) redirect('/news?error=Message title and text are required.')
  const access = await getMessageAccess(messageId, user.id)
  if (!access.message || !access.isMember || access.message.author_id !== user.id) {
    redirect('/news?error=You can only edit your own messages.')
  }
  const { error } = await getServiceDb().from('messages').update({ title, body }).eq('id', messageId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function deleteMessage(formData: FormData) {
  const { user, isAdmin } = await getUserAndAdmin()
  const messageId = String(formData.get('message_id') || '')
  if (!messageId) redirect('/news?error=Message not found.')
  const access = await getMessageAccess(messageId, user.id)
  if (!access.message || !access.isMember || (!isAdmin && !access.isContestAdmin && access.message.author_id !== user.id)) {
    redirect('/news?error=You can only delete messages in your contests.')
  }
  const { error } = await getServiceDb().from('messages').delete().eq('id', messageId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function createMessageReply(formData: FormData) {
  const { user } = await getUserAndAdmin()
  const messageId = String(formData.get('message_id') || '')
  const body = String(formData.get('body') || '').trim()
  if (!messageId || !body) redirect('/news?error=Reply text is required.')
  const access = await getMessageAccess(messageId, user.id)
  if (!access.message || !access.isMember) {
    redirect('/news?error=You can only reply in contests you belong to.')
  }
  const { error } = await getServiceDb().from('message_replies').insert({
    message_id: messageId,
    author_id: user.id,
    body,
  })
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function updateMessageReply(formData: FormData) {
  const { user } = await getUserAndAdmin()
  const replyId = String(formData.get('reply_id') || '')
  const body = String(formData.get('body') || '').trim()
  if (!replyId || !body) redirect('/news?error=Reply text is required.')
  const { data: reply } = await getServiceDb()
    .from('message_replies')
    .select('message_id, author_id')
    .eq('id', replyId)
    .maybeSingle()
  const access = reply ? await getMessageAccess(reply.message_id, user.id) : null
  if (!reply || !access?.isMember || reply.author_id !== user.id) {
    redirect('/news?error=You can only edit your own replies.')
  }
  const { error } = await getServiceDb().from('message_replies').update({ body }).eq('id', replyId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function deleteMessageReply(formData: FormData) {
  const { user, isAdmin } = await getUserAndAdmin()
  const replyId = String(formData.get('reply_id') || '')
  const { data: reply } = await getServiceDb()
    .from('message_replies')
    .select('message_id, author_id')
    .eq('id', replyId)
    .maybeSingle()
  const access = reply ? await getMessageAccess(reply.message_id, user.id) : null
  if (!reply || !access?.isMember || (!isAdmin && !access.isContestAdmin && reply.author_id !== user.id)) {
    redirect('/news?error=You can only delete replies in your contests.')
  }
  const { error } = await getServiceDb().from('message_replies').delete().eq('id', replyId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  redirect('/news')
}

export async function markMessagesRead() {
  const { user } = await getUserAndAdmin()
  const { error } = await getServiceDb().from('message_reads').upsert({
    user_id: user.id,
    last_read_at: new Date().toISOString(),
  })
  if (error) throw new Error(`Unable to mark messages as read: ${error.message}`)
  revalidatePath('/news')
}

export async function createNewsPost(formData: FormData) {
  const { user } = await getUserAndAdmin()
  if (user.email?.toLowerCase() !== OWNER_EMAIL) redirect('/news?error=Only the ScoreCaster owner can publish website updates.')
  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()
  if (!title || !body) redirect('/news?error=Title and update text are required.')
  const { error } = await getServiceDb().from('news_posts').insert({ author_id: user.id, title, body })
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  revalidatePath('/')
  const redirectTo = String(formData.get('redirect_to') || '/news')
  redirect(redirectTo === '/' ? '/?success=Update+saved.' : '/news')
}

export async function deleteNewsPost(formData: FormData) {
  const { user, isAdmin } = await getUserAndAdmin()
  if (!isAdmin && user.email?.toLowerCase() !== OWNER_EMAIL) redirect('/news?error=Only the ScoreCaster owner can delete website updates.')
  const postId = String(formData.get('post_id') || '')
  if (!postId) redirect('/news?error=Update not found.')
  const { error } = await getServiceDb().from('news_posts').delete().eq('id', postId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  revalidatePath('/')
  const redirectTo = String(formData.get('redirect_to') || '/news')
  redirect(redirectTo === '/' ? '/?success=Update+saved.' : '/news')
}

export async function updateNewsPost(formData: FormData) {
  const { user } = await getUserAndAdmin()
  if (user.email?.toLowerCase() !== OWNER_EMAIL) redirect('/news?error=Only the ScoreCaster owner can edit website updates.')
  const postId = String(formData.get('post_id') || '')
  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()
  if (!postId || !title || !body) redirect('/news?error=Title and update text are required.')
  const { error } = await getServiceDb().from('news_posts').update({ title, body }).eq('id', postId)
  if (error) redirect(`/news?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/news')
  revalidatePath('/')
  const redirectTo = String(formData.get('redirect_to') || '/news')
  redirect(redirectTo === '/' ? '/?success=Update+saved.' : '/news')
}
