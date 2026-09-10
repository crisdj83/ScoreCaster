'use client'

import { useEffect } from 'react'
import { markMessagesRead } from './actions'

export default function MessagesReadMarker() {
  useEffect(() => {
    void markMessagesRead().catch(() => {
      // Ignore — unread badge stays until message_reads exists in Supabase.
    })
  }, [])
  return null
}
