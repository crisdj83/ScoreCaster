import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'

export default async function UpdatePasswordPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;

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
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-12">
      <div className="flex flex-col items-center mb-8">
        <Trophy className="h-12 w-12 text-scorecaster-green mb-2" />
        <h1 className="text-2xl font-bold text-scorecaster-text">Reset Password</h1>
        <p className="text-gray-500">Enter your new secure password below</p>
      </div>

      <form action={updatePassword} className="flex-1 flex flex-col w-full justify-center gap-4 text-scorecaster-text">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="password">
            New Password
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        
        {searchParams?.message && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
            {searchParams.message}
          </div>
        )}

        <button
          className="bg-scorecaster-green hover:bg-green-700 text-white rounded-md px-4 py-2 font-medium transition-colors mt-4"
        >
          Update Password
        </button>
      </form>
    </div>
  )
}