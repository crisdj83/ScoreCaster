import { login, signup, resetPassword } from './actions'
import { Trophy } from 'lucide-react'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  
  // A simple check to see if the message is an error or a success message
  const isSuccessMessage = searchParams?.message?.includes('Check your email');

  return (
    <div className="flex-1 flex flex-col w-full max-w-md justify-center mx-auto py-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-2xl bg-gray-900 p-3 mb-3">
            <Trophy className="h-8 w-8 text-[#d4ff00]" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Welcome to ScoreCaster</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to predict and compete</p>
        </div>

      <form className="flex flex-col w-full gap-4 text-scorecaster-text">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
            type="password"
            name="password"
            placeholder="••••••••"
            minLength={6}
          />
          <span className="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters.
          </span>
        </div>
        
        {/* Error / Success Message Display */}
        {searchParams?.message && (
          <div           className={`p-3 rounded-xl text-sm text-center ${isSuccessMessage ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {searchParams.message}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <button
            formAction={login}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-3 font-black uppercase tracking-wider text-xs transition-colors"
          >
            Sign In
          </button>
          <button
            formAction={signup}
            className="border border-scorecaster-green text-scorecaster-green hover:bg-green-50 rounded-xl px-4 py-3 font-black uppercase tracking-wider text-xs transition-colors"
          >
            Sign Up
          </button>
        </div>
        
        {/* Forgot Password Button */}
        <div className="text-center mt-2">
          <button
            formAction={resetPassword}
            formNoValidate // Allows clicking this without filling in the password
            className="text-sm text-gray-500 hover:text-scorecaster-green underline transition-colors"
          >
            Forgot Password?
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}