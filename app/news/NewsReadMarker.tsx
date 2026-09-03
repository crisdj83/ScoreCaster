'use client'

import { useEffect } from 'react'
import { markNewsRead } from './actions'

export default function NewsReadMarker() {
  useEffect(() => {
    void markNewsRead()
  }, [])
  return null
}
