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
    <div className="flex-1 flex flex-col w-full max-w-md justify-center mx-auto py-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 md:p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="rounded-2xl bg-gray-900 p-3 mb-3">
          <Trophy className="h-8 w-8 text-[#d4ff00]" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Reset Password</h1>
        <p className="text-gray-500 text-sm mt-1">Enter your new secure password below</p>
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
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-3 font-black uppercase tracking-wider text-xs transition-colors mt-4"
        >
          Update Password
        </button>
      </form>
      </div>
    </div>
  )
}