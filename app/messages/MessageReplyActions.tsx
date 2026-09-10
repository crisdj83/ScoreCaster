'use client'

import { useState } from 'react'
import { deleteMessageReply, updateMessageReply } from './actions'
import { useTranslations } from '../components/LocaleProvider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <form action={updateMessageReply} className="mt-2 flex flex-wrap gap-2">
      <input type="hidden" name="reply_id" value={replyId} />
      <Input name="body" defaultValue={body} required maxLength={5000} className="min-w-0 flex-1" />
      <Button type="submit" size="sm" className="min-h-11 uppercase tracking-wider">
        {t('Save')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-h-11"
        onClick={() => setEditing(false)}
      >
        {t('Cancel')}
      </Button>
    </form>
  ) : (
    <div className="mt-2 flex gap-2">
      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 text-zinc-400 hover:text-zinc-100"
          onClick={() => setEditing(true)}
        >
          {t('Edit')}
        </Button>
      )}
      <form
        action={deleteMessageReply}
        onSubmit={(event) => {
          if (!window.confirm(t('Delete this reply?'))) event.preventDefault()
        }}
      >
        <input type="hidden" name="reply_id" value={replyId} />
        <Button type="submit" variant="destructive" size="sm" className="min-h-11">
          {canModerate ? t('Remove') : t('Delete')}
        </Button>
      </form>
    </div>
  )
}
