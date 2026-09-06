import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default async function UpdatePasswordPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  const t = getTranslations(getServerLocale())

  // This is the server action that actually updates the password in the database
  async function updatePassword(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      redirect('/update-password?message=' + error.message)
    }

    // After successfully updating, send them to the dashboard
    redirect('/')
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-3 rounded-xl bg-zinc-950 p-3">
              <Trophy className="h-8 w-8 text-xactscore-accent" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">
              {t('Reset Password')}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{t('Enter your new secure password below')}</p>
          </div>

          <form action={updatePassword} className="flex w-full flex-col gap-4 text-zinc-100">
            <div>
              <Label htmlFor="password">{t('New Password')}</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {searchParams?.message && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
                {searchParams.message}
              </div>
            )}

            <Button type="submit" className="mt-2 w-full uppercase tracking-wider">
              {t('Update Password')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
