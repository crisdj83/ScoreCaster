'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { useTranslations } from '../components/LocaleProvider'
import { createClient } from '../../lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { completePasswordReset } from './actions'

type Step = 'email' | 'code' | 'password'

function isHiddenSendError(message: string) {
  const text = message.toLowerCase()
  return (
    text.includes('signups not allowed') ||
    text.includes('user not found') ||
    text.includes('unable to validate email')
  )
}

export default function ForgotPasswordForm() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(searchParams.get('reset') === '1' ? 'password' : 'email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(searchParams.get('error') || '')
  const [pending, setPending] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  async function sendCode() {
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Please enter your email address')
      return
    }

    setPending(true)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=/forgot-password`

      const recovery = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo })
      if (recovery.error && !isHiddenSendError(recovery.error.message)) {
        setError(recovery.error.message || 'Could not send reset code')
        return
      }

      setStep('code')
      setResendIn(30)
    } finally {
      setPending(false)
    }
  }

  async function verifyCode() {
    setError('')
    const trimmedEmail = email.trim().toLowerCase()
    const token = code.replace(/\s+/g, '')
    if (!trimmedEmail || token.length < 6) {
      setError('Invalid or expired code')
      return
    }

    setPending(true)
    try {
      const supabase = createClient()
      const types = ['recovery', 'email', 'magiclink'] as const
      let lastError = 'Invalid or expired code'

      for (const type of types) {
        const { error } = await supabase.auth.verifyOtp({
          email: trimmedEmail,
          token,
          type,
        })
        if (!error) {
          setStep('password')
          return
        }
        lastError = error.message || lastError
      }

      setError(lastError)
    } finally {
      setPending(false)
    }
  }

  async function savePassword() {
    setError('')
    setPending(true)
    try {
      const result = await completePasswordReset(password, confirmPassword)
      if (result && 'error' in result && result.error) {
        setError(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  const title =
    step === 'email'
      ? t('Reset Password')
      : step === 'code'
        ? t('Verification code')
        : t('Set a new password')

  const subtitle =
    step === 'email'
      ? t('Enter the email for your account. We will send a reset code.')
      : step === 'code'
        ? t('We sent a 6-digit code to your email.')
        : t('Enter your new secure password below')

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-3 rounded-xl bg-zinc-950 p-3">
              <Trophy className="h-8 w-8 text-xactscore-accent" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">
              {title}
            </h1>
            <p className="mt-1 text-center text-sm text-zinc-400">{subtitle}</p>
          </div>

          <form
            className="flex w-full flex-col gap-4 text-zinc-100"
            onSubmit={(event) => {
              event.preventDefault()
              if (step === 'email') void sendCode()
              else if (step === 'code') void verifyCode()
              else void savePassword()
            }}
          >
            {step === 'email' ? (
              <div>
                <Label htmlFor="reset-email">{t('Email')}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            ) : null}

            {step === 'code' ? (
              <div>
                <Label htmlFor="reset-code">{t('Verification code')}</Label>
                <Input
                  id="reset-code"
                  type="text"
                  name="code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="text-center font-mono text-lg tracking-[0.35em]"
                  required
                  minLength={6}
                />
                <p className="mt-2 text-center text-xs text-zinc-500">{email}</p>
                <p className="mt-1 text-center text-xs text-zinc-500">
                  {t('Check spam too. The code is 6 digits.')}
                </p>
              </div>
            ) : null}

            {step === 'password' ? (
              <>
                <div>
                  <Label htmlFor="new-password">{t('New Password')}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    name="new_password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                  <span className="mt-1 block text-xs text-zinc-500">
                    {t('Password must be at least 6 characters.')}
                  </span>
                </div>
                <div>
                  <Label htmlFor="confirm-password">{t('Confirm new password')}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    name="confirm_password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
              </>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
                {t(error)}
              </div>
            ) : null}

            <Button type="submit" disabled={pending} className="mt-2 w-full uppercase tracking-wider">
              {pending
                ? '…'
                : step === 'email'
                  ? t('Send code')
                  : step === 'code'
                    ? t('Verify code')
                    : t('Update Password')}
            </Button>

            {step === 'code' ? (
              <button
                type="button"
                disabled={pending || resendIn > 0}
                onClick={() => void sendCode()}
                className="min-h-11 text-sm text-zinc-500 underline transition-colors hover:text-xactscore-accent disabled:no-underline disabled:opacity-50"
              >
                {resendIn > 0 ? `${t('Resend code')} (${resendIn})` : t('Resend code')}
              </button>
            ) : null}

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center text-sm text-zinc-500 underline transition-colors hover:text-xactscore-accent"
              >
                {t('Back to sign in')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
