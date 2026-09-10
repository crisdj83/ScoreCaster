'use client'

import { useState } from 'react'
import { deleteMessage, updateMessage } from './actions'
import { useTranslations } from '../components/LocaleProvider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

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
        <Input name="title" defaultValue={title} required maxLength={120} />
        <Textarea name="body" defaultValue={body} required maxLength={5000} rows={3} className="min-h-24" />
        <div className="flex gap-2">
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
        </div>
      </form>
    )
  }

  return (
    <div className="flex shrink-0 gap-2">
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
        action={deleteMessage}
        onSubmit={(event) => {
          if (!window.confirm(t('Delete this message?'))) event.preventDefault()
        }}
      >
        <input type="hidden" name="message_id" value={messageId} />
        <Button type="submit" variant="destructive" size="sm" className="min-h-11">
          {canModerate ? t('Remove') : t('Delete')}
        </Button>
      </form>
    </div>
  )
}
