'use client'

import { useState } from 'react'
import { deleteMessageReply, updateMessageReply } from './actions'
import { useTranslations } from '../components/LocaleProvider'

export default function MessageReplyActions({
  replyId,
  body,
  canEdit,
  canModerate,
}: {
  replyId: string
  body: string
  canEdit: boolean
  canModerate: boolean
}) {
  const [editing, setEditing] = useState(false)
  const t = useTranslations()
  return editing ? (
    <form action={updateMessageReply} className="mt-2 flex gap-2">
      <input type="hidden" name="reply_id" value={replyId} />
      <input name="body" defaultValue={body} required maxLength={5000} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
      <button className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white">{t('Save')}</button>
      <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600">{t('Cancel')}</button>
    </form>
  ) : (
    <div className="mt-2 flex gap-3">
      {canEdit && <button type="button" onClick={() => setEditing(true)} className="text-xs font-bold text-gray-500 hover:text-gray-900">{t('Edit')}</button>}
      <form action={deleteMessageReply} onSubmit={(event) => {
        if (!window.confirm(t('Delete this reply?'))) event.preventDefault()
      }}>
        <input type="hidden" name="reply_id" value={replyId} />
        <button className="text-xs font-bold text-red-600 hover:text-red-800">{canModerate ? t('Remove') : t('Delete')}</button>
      </form>
    </div>
  )
}
