'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

export default function MatchReminderToggle() {
  const t = useTranslations()
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  const [enabled, setEnabled] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const pushOk = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(pushOk && Boolean(vapidKey))
    setIosNeedsInstall(isIosDevice() && !isStandaloneDisplay())
    if (!pushOk) return

    void fetch('/api/push/subscribe')
      .then((response) => response.json())
      .then((data: { enabled?: boolean }) => setEnabled(Boolean(data.enabled)))
      .catch(() => {})
  }, [vapidKey])

  async function enable() {
    setMessage('')
    if (!vapidKey) {
      setMessage(t('Match reminders are not configured yet.'))
      return
    }
    if (iosNeedsInstall) {
      setMessage(t('On iPhone, install XactScore to your Home Screen first, then turn reminders on from that app icon.'))
      return
    }

    setPending(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setMessage(t('Notifications were blocked. Allow them in your phone settings, then try again.'))
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!response.ok) {
        throw new Error('Could not save reminder subscription')
      }
      setEnabled(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('Could not enable match reminders'))
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

          {message ? <p className="text-sm text-red-300">{message}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
