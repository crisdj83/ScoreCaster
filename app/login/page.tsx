import { login, signup, resetPassword } from './actions'
import { Trophy } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams
  const t = getTranslations(getServerLocale())
  const isSuccessMessage = searchParams?.message?.includes('Check your email')

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-3 rounded-xl bg-zinc-950 p-3">
              <Trophy className="h-8 w-8 text-scorecaster-accent" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">
              {t('Welcome to ScoreCaster')}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{t('Sign in to predict and compete')}</p>
          </div>

          <form className="flex w-full flex-col gap-4 text-zinc-100">
            <div>
              <Label htmlFor="email">{t('Email')}</Label>
              <Input id="email" name="email" placeholder="you@example.com" required type="email" />
            </div>

            <div>
              <Label htmlFor="password">{t('Password')}</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                minLength={6}
              />
              <span className="mt-1 block text-xs text-zinc-500">
                {t('Password must be at least 6 characters.')}
              </span>
            </div>

            {searchParams?.message && (
              <div
                className={`rounded-xl p-3 text-center text-sm ${
                  isSuccessMessage
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {searchParams.message}
              </div>
            )}

            <div className="mt-2 flex flex-col gap-2">
              <button
                formAction={login}
                className={cn(buttonVariants(), 'w-full uppercase tracking-wider')}
              >
                {t('Sign In')}
              </button>
              <button
                formAction={signup}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full border-scorecaster-accent text-scorecaster-accent uppercase tracking-wider hover:bg-scorecaster-accent/10'
                )}
              >
                {t('Sign Up')}
              </button>
            </div>

            <div className="mt-2 text-center">
              <button
                formAction={resetPassword}
                formNoValidate
                className="min-h-11 text-sm text-zinc-500 underline transition-colors hover:text-scorecaster-accent"
              >
                {t('Forgot Password?')}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
