'use client'

import { useState } from 'react'
import { deleteMessage, updateMessage } from './actions'
import { useTranslations } from '../components/LocaleProvider'

export default function MessageActions({
  messageId,
  title,
  body,
  canEdit,
  canModerate,
}: {
  messageId: string
  title: string
  body: string
  canEdit: boolean
  canModerate: boolean
}) {
  const [editing, setEditing] = useState(false)
  const t = useTranslations()

  if (editing) {
    return (
      <form action={updateMessage} className="flex max-w-sm flex-col gap-2">
        <input type="hidden" name="message_id" value={messageId} />
        <input name="title" defaultValue={title} required maxLength={120} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <textarea name="body" defaultValue={body} required maxLength={5000} rows={3} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white">{t('Save')}</button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600">{t('Cancel')}</button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex shrink-0 gap-3">
      {canEdit && <button type="button" onClick={() => setEditing(true)} className="text-xs font-bold text-gray-500 hover:text-gray-900">{t('Edit')}</button>}
      <form action={deleteMessage} onSubmit={(event) => {
        if (!window.confirm(t('Delete this message?'))) event.preventDefault()
      }}>
        <input type="hidden" name="message_id" value={messageId} />
        <button className="text-xs font-bold text-red-600 hover:text-red-800">{canModerate ? t('Remove') : t('Delete')}</button>
      </form>
    </div>
  )
}
