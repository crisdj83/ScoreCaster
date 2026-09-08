'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'

export default function CopyInviteButton({
  url,
  className,
}: {
  url: string
  className?: string
}) {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold uppercase tracking-wider text-orange-100 transition hover:bg-white/20',
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? t('Copied') : t('Copy invite link')}
    </button>
  )
}
