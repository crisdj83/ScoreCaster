import { createClient } from '../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { MessageSquare, Send } from 'lucide-react'
import {
  createMessage,
  createMessageReply,
} from './actions'
import MessagesReadMarker from './MessagesReadMarker'
import MessageActions from './MessageActions'
import MessageReplyActions from './MessageReplyActions'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'

type MessageRecord = {
  id: string
  contest_id: string
  author_id: string
  title: string
  body: string
  created_at: string
  users?: { username?: string | null; email?: string | null }[] | null
  contests?: { name?: string | null }[] | null
}

type ReplyRecord = {
  id: string
  message_id: string
  author_id: string
  body: string
  created_at: string
  users?: { username?: string | null; email?: string | null }[] | null
}

export default async function MessagesPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('contest_members')
    .select('contest_id, role, contests(name)')
    .eq('user_id', user.id)

  const contestIds = (memberships || []).map(membership => membership.contest_id)
  const memberContests = (memberships || []).map(membership => ({
    id: membership.contest_id,
    name: (membership.contests as unknown as { name?: string } | null)?.name || t('Contest'),
    role: membership.role,
  }))
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: messageData } = contestIds.length
    ? await db
      .from('messages')
      .select('id, contest_id, author_id, title, body, created_at, users(username, email), contests(name)')
      .in('contest_id', contestIds)
      .order('created_at', { ascending: false })
    : { data: [] }
  const messages = (messageData || []) as MessageRecord[]
  const messageIds = messages.map(message => message.id)
  const { data: replyData } = messageIds.length
    ? await db
      .from('message_replies')
      .select('id, message_id, author_id, body, created_at, users(username, email)')
      .in('message_id', messageIds)
      .order('created_at')
    : { data: [] }
  const replies = (replyData || []) as ReplyRecord[]
  const isGlobalAdmin = (await supabase.from('users').select('is_global_admin').eq('id', user.id).single()).data?.is_global_admin === true

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 pt-2">
      <MessagesReadMarker />
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gray-900 p-2.5 text-[#d4ff00]"><MessageSquare className="h-6 w-6" /></div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">{t('Messages')}</h1>
          <p className="text-sm text-gray-500">{t('Discuss matches and contests with your fellow members.')}</p>
        </div>
      </div>
      {searchParams?.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{searchParams.error}</div>}
      {memberContests.length > 0 && (
        <form action={createMessage} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <h2 className="font-black uppercase tracking-tight text-gray-900">{t('Start a discussion')}</h2>
          <select name="contest_id" required className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm">
            <option value="">{t('Choose a contest')}</option>
            {memberContests.map(contest => <option key={contest.id} value={contest.id}>{contest.name}</option>)}
          </select>
          <input name="title" required maxLength={120} placeholder={t('Discussion title')} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
          <textarea name="body" required maxLength={5000} rows={4} placeholder={t('Write a message...')} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
          <button className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-wider text-white"><Send className="h-4 w-4" /> {t('Post message')}</button>
        </form>
      )}
      {!memberContests.length ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">{t('Join a contest to see its messages.')}</div>
      ) : !messages.length ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">{t('No messages yet.')}</div>
      ) : messages.map(message => {
        const contest = memberContests.find(item => item.id === message.contest_id)
        const author = message.users?.[0]?.username || message.users?.[0]?.email?.split('@')[0] || t('Player')
        const messageReplies = replies.filter(reply => reply.message_id === message.id)
        const canModerate = isGlobalAdmin || contest?.role === 'admin'
        return (
          <article key={message.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {contest?.name || t('Contest')} · {new Date(message.created_at).toLocaleString()} · {t('Posted by')} {author}
                </p>
                <h2 className="mt-2 text-xl font-black text-gray-900">{message.title}</h2>
              </div>
              {(message.author_id === user.id || canModerate) && (
                <MessageActions
                  messageId={message.id}
                  title={message.title}
                  body={message.body}
                  canEdit={message.author_id === user.id}
                  canModerate={canModerate}
                />
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{message.body}</p>
            <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
              {messageReplies.map(reply => {
                const replyAuthor = reply.users?.[0]?.username || reply.users?.[0]?.email?.split('@')[0] || t('Player')
                return (
                  <div key={reply.id} className="rounded-xl bg-gray-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-gray-900">{replyAuthor}</strong>
                      <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-gray-600">{reply.body}</p>
                    {(reply.author_id === user.id || canModerate) && (
                      <MessageReplyActions replyId={reply.id} body={reply.body} canEdit={reply.author_id === user.id} canModerate={canModerate} />
                    )}
                  </div>
                )
              })}
              <form action={createMessageReply} className="flex gap-2 pt-2">
                <input type="hidden" name="message_id" value={message.id} />
                <input name="body" required maxLength={5000} placeholder={t('Reply to this message...')} className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                <button className="rounded-xl bg-gray-900 px-4 text-white" aria-label={t('Reply')}><MessageSquare className="h-4 w-4" /></button>
              </form>
            </div>
          </article>
        )
      })}
    </div>
  )
}
