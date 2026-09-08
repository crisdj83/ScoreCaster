'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from './LocaleProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LandingJoinForm() {
  const t = useTranslations()
  const router = useRouter()
  const [key, setKey] = useState('')

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const cleaned = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!cleaned) return
    router.push(`/join/${encodeURIComponent(cleaned)}`)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="landing-invite-key">
        {t('Paste an invite key')}
      </label>
      <Input
        id="landing-invite-key"
        name="contest_key"
        value={key}
        onChange={(event) => setKey(event.target.value)}
        placeholder="btyfwtx"
        autoComplete="off"
        spellCheck={false}
        className="text-center font-mono text-base uppercase tracking-[0.28em] sm:text-left"
      />
      <Button type="submit" variant="secondary" className="uppercase tracking-wider sm:w-auto">
        {t('Join this league')}
      </Button>
    </form>
  )
}
