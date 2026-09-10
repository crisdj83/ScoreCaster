'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { normalizeVapidPublicKey, vapidApplicationServerKey } from '../../lib/vapid'

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
  const ios = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || ios
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function MatchReminderToggle() {
  const t = useTranslations()
  const bundledKey = normalizeVapidPublicKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
  const [vapidKey, setVapidKey] = useState(bundledKey)
  const [enabled, setEnabled] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const pushOk = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setIosNeedsInstall(isIosDevice() && !isStandaloneDisplay())
    if (!pushOk) {
      setSupported(false)
      return
    }

    void fetch('/api/push/subscribe')
      .then((response) => response.json())
      .then((data: { enabled?: boolean; configured?: boolean; publicKey?: string }) => {
        const liveKey = normalizeVapidPublicKey(data.publicKey)
        if (liveKey) setVapidKey(liveKey)
        setEnabled(Boolean(data.enabled))
        setSupported(data.configured !== false && Boolean(liveKey || bundledKey))
      })
      .catch(() => {
        setSupported(Boolean(bundledKey))
      })
  }, [bundledKey])

  async function enable() {
    setMessage('')
    const key = vapidKey || bundledKey
    if (!key) {
      setMessage(t('Match reminders are not configured yet.'))
      return
    }
    if (iosNeedsInstall) {
      setMessage(t('On iPhone, install XactScore to your Home Screen first, then turn reminders on from that app icon.'))
      return
    }

    setPending(true)
    try {
      let applicationServerKey: Uint8Array
      try {
        applicationServerKey = vapidApplicationServerKey(key)
      } catch {
        setMessage(t('Push notifications are misconfigured. Check the VAPID public key.'))
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setMessage(t('Notifications were blocked. Allow them in your phone settings, then try again.'))
        return
      }

      const registration =
        (await navigator.serviceWorker.getRegistration('/sw.js')) ||
        (await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }))
      await navigator.serviceWorker.ready

      const existing = await registration.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      })

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!response.ok) {
        throw new Error(t('Could not save reminder subscription'))
      }
      setEnabled(true)
    } catch (error) {
      const raw = error instanceof Error ? error.message : ''
      if (/invalid characters|atob|applicationServerKey|InvalidAccessError|DataError/i.test(raw)) {
        setMessage(t('Push notifications are misconfigured. Check the VAPID public key.'))
      } else {
        setMessage(raw || t('Could not enable match reminders'))
      }
    } finally {
      setPending(false)
    }
  }

  async function disable() {
    setMessage('')
    setPending(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      await subscription?.unsubscribe()
      await fetch('/api/push/subscribe', { method: 'DELETE' })
      setEnabled(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('Could not disable match reminders'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-zinc-100">
              <Bell className="h-5 w-5 text-xactscore-accent" /> {t('Notifications')}
            </h3>
            <p className="text-sm text-zinc-400">
              {t('Get a phone notification about 2 hours before kickoff if you still need to put scores in, and when someone posts in your league.')}
            </p>
          </div>

          {!supported ? (
            <p className="text-sm text-zinc-500">{t('Match reminders are not configured yet.')}</p>
          ) : (
            <Button
              type="button"
              disabled={pending}
              onClick={() => void (enabled ? disable() : enable())}
              className="uppercase tracking-wider"
            >
              {pending ? '…' : enabled ? t('Turn notifications off') : t('Turn notifications on')}
            </Button>
          )}

          {iosNeedsInstall ? (
            <p className="text-sm text-zinc-500">
              {t('On iPhone, install XactScore to your Home Screen first, then turn reminders on from that app icon.')}{' '}
              <Link href="/help/install#ios" className="text-xactscore-accent underline">
                {t('Install on iPhone')}
              </Link>
            </p>
          ) : null}

          {message ? <p className="text-sm text-red-600 dark:text-red-300">{message}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
