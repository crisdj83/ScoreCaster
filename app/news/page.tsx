import { createClient } from '../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { MessageSquare, Newspaper, Send } from 'lucide-react'
import { createNewsPost, createNewsReply, deleteNewsPost } from './actions'
import NewsReadMarker from './NewsReadMarker'
import NewsReplyActions from './NewsReplyActions'

export default async function NewsPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('is_global_admin, username, email').eq('id', user.id).single()
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: posts } = await db.from('news_posts').select('id, title, body, created_at, users(username, email)').order('created_at', { ascending: false })
  const postIds = (posts || []).map(post => post.id)
  const { data: replies } = postIds.length
    ? await db.from('news_replies').select('id, post_id, author_id, body, created_at, users(username, email)').in('post_id', postIds).order('created_at')
    : { data: [] }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 pt-2">
      <NewsReadMarker />
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gray-900 p-2.5 text-[#d4ff00]"><Newspaper className="h-6 w-6" /></div>
        <div><h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">News & Updates</h1><p className="text-sm text-gray-500">Announcements and conversations from your ScoreCaster community.</p></div>
      </div>
      {searchParams?.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{searchParams.error}</div>}
      {profile?.is_global_admin && (
        <form action={createNewsPost} className="space-y-4 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-6 shadow-lg">
          <h2 className="font-black uppercase tracking-tight text-orange-300">Publish an update</h2>
          <input name="title" required placeholder="Headline" className="w-full rounded-xl border border-orange-500/40 bg-[#242424] px-4 py-3 text-white" />
          <textarea name="body" required rows={4} placeholder="Share an update with the league..." className="w-full rounded-xl border border-orange-500/40 bg-[#242424] px-4 py-3 text-white" />
          <button className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-wider text-white"><Send className="h-4 w-4" /> Publish</button>
        </form>
      )}
      {!posts?.length ? <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">No news updates yet.</div> : posts.map(post => {
        const postReplies = replies?.filter(reply => reply.post_id === post.id) || []
        return <article key={post.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {new Date(post.created_at).toLocaleString()}
            {post.users?.[0] && ` · Posted by ${post.users[0].username || post.users[0].email?.split('@')[0] || 'Admin'}`}
          </p>
          {profile?.is_global_admin && <form action={deleteNewsPost}><input type="hidden" name="post_id" value={post.id} /><button className="text-xs font-bold text-red-600 hover:text-red-800">Remove post</button></form>}
          </div>
          <h2 className="mt-2 text-xl font-black text-gray-900">{post.title}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{post.body}</p>
          <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
            {postReplies.map(reply => {
              const author = reply.users?.[0]?.username || reply.users?.[0]?.email?.split('@')[0] || 'Player'
              return (
                <div key={reply.id} className="rounded-xl bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-gray-900">{author}</strong>
                    <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-gray-600">{reply.body}</p>
                  {reply.author_id === user.id && <NewsReplyActions replyId={reply.id} body={reply.body} />}
                </div>
              )
            })}
            <form action={createNewsReply} className="flex gap-2 pt-2"><input type="hidden" name="post_id" value={post.id} /><input name="body" required placeholder="Reply to this update..." className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm" /><button className="rounded-xl bg-gray-900 px-4 text-white"><MessageSquare className="h-4 w-4" /></button></form>
          </div>
        </article>
      })}
    </div>
  )
}
