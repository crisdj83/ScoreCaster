'use client'

import { useEffect } from 'react'
import { markMessagesRead } from './actions'

export default function MessagesReadMarker() {
  useEffect(() => {
    void markMessagesRead()
  }, [])
  return null
}
