'use client'

import { useState } from 'react'
import { deleteNewsReply, updateNewsReply } from './actions'

export default function NewsReplyActions({ replyId, body }: { replyId: string; body: string }) {
  const [editing, setEditing] = useState(false)
  return editing ? (
    <form action={updateNewsReply} className="mt-2 flex gap-2">
      <input type="hidden" name="reply_id" value={replyId} />
      <input name="body" defaultValue={body} required className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
      <button className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white">Save</button>
      <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600">Cancel</button>
    </form>
  ) : (
    <div className="mt-2 flex gap-3">
      <button type="button" onClick={() => setEditing(true)} className="text-xs font-bold text-gray-500 hover:text-gray-900">Edit</button>
      <form action={deleteNewsReply} onSubmit={(event) => {
        if (!window.confirm('Delete this reply?')) event.preventDefault()
      }}>
        <input type="hidden" name="reply_id" value={replyId} />
        <button className="text-xs font-bold text-red-600 hover:text-red-800">Delete</button>
      </form>
    </div>
  )
}
