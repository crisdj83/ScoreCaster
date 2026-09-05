import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
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
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PageHeader, EmptyState } from '@/components/ui/page-header'

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
  let messages: MessageRecord[] = []
  let replies: ReplyRecord[] = []
  let isGlobalAdmin = false
  try {
    const db = createAdminClient()
    const [{ data: messageData }, { data: profile }] = await Promise.all([
      contestIds.length
        ? db
          .from('messages')
          .select('id, contest_id, author_id, title, body, created_at, users(username, email), contests(name)')
          .in('contest_id', contestIds)
          .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from('users').select('is_global_admin').eq('id', user.id).single(),
    ])
    messages = (messageData || []) as MessageRecord[]
    const messageIds = messages.map(message => message.id)
    const { data: replyData } = messageIds.length
      ? await db
        .from('message_replies')
        .select('id, message_id, author_id, body, created_at, users(username, email)')
        .in('message_id', messageIds)
        .order('created_at')
      : { data: [] }
    replies = (replyData || []) as ReplyRecord[]
    isGlobalAdmin = profile?.is_global_admin === true
  } catch {
    isGlobalAdmin = false
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 pt-2">
      <MessagesReadMarker />
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-zinc-950 p-2.5 text-scorecaster-accent">
          <MessageSquare className="h-6 w-6" />
        </div>
        <PageHeader
          className="mb-0"
          title={t('Messages')}
          description={t('Discuss matches and contests with your fellow members.')}
        />
      </div>
      {searchParams?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
          {searchParams.error}
        </div>
      )}
      {memberContests.length > 0 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <form action={createMessage} className="space-y-4">
              <h2 className="font-black uppercase tracking-tight text-zinc-100">{t('Start a discussion')}</h2>
              <select
                name="contest_id"
                required
                className="focus-frost flex h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-100 outline-none ring-0 transition-[border-color,box-shadow] focus:ring-0"
              >
                <option value="">{t('Choose a contest')}</option>
                {memberContests.map(contest => (
                  <option key={contest.id} value={contest.id}>
                    {contest.name}
                  </option>
                ))}
              </select>
              <Input name="title" required maxLength={120} placeholder={t('Discussion title')} />
              <Textarea name="body" required maxLength={5000} rows={4} placeholder={t('Write a message...')} />
              <Button type="submit" className="uppercase tracking-wider">
                <Send className="h-4 w-4" /> {t('Post message')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      {!memberContests.length ? (
        <EmptyState title={t('Join a contest to see its messages.')} />
      ) : !messages.length ? (
        <EmptyState title={t('No messages yet.')} />
      ) : (
        messages.map(message => {
          const contest = memberContests.find(item => item.id === message.contest_id)
          const author =
            message.users?.[0]?.username || message.users?.[0]?.email?.split('@')[0] || t('Player')
          const messageReplies = replies.filter(reply => reply.message_id === message.id)
          const canModerate = isGlobalAdmin || contest?.role === 'admin'
          return (
            <Card key={message.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {contest?.name || t('Contest')} · {new Date(message.created_at).toLocaleString()} ·{' '}
                      {t('Posted by')} {author}
                    </p>
                    <h2 className="mt-2 text-xl font-black text-zinc-100">{message.title}</h2>
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
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{message.body}</p>
                <div className="mt-6 space-y-2 border-t border-zinc-800 pt-4">
                  {messageReplies.map(reply => {
                    const replyAuthor =
                      reply.users?.[0]?.username || reply.users?.[0]?.email?.split('@')[0] || t('Player')
                    return (
                      <div key={reply.id} className="rounded-xl bg-zinc-950 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-zinc-100">{replyAuthor}</strong>
                          <span className="text-xs text-zinc-500">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-zinc-400">{reply.body}</p>
                        {(reply.author_id === user.id || canModerate) && (
                          <MessageReplyActions
                            replyId={reply.id}
                            body={reply.body}
                            canEdit={reply.author_id === user.id}
                            canModerate={canModerate}
                          />
                        )}
                      </div>
                    )
                  })}
                  <form action={createMessageReply} className="flex gap-2 pt-2">
                    <input type="hidden" name="message_id" value={message.id} />
                    <Input
                      name="body"
                      required
                      maxLength={5000}
                      placeholder={t('Reply to this message...')}
                      className="min-w-0 flex-1"
                    />
                    <Button type="submit" size="icon" aria-label={t('Reply')}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
