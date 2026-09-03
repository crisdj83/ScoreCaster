import { login, signup, resetPassword } from './actions'
import { Trophy } from 'lucide-react'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  
  // A simple check to see if the message is an error or a success message
  const isSuccessMessage = searchParams?.message?.includes('Check your email');

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-12">
      <div className="flex flex-col items-center mb-8">
        <Trophy className="h-12 w-12 text-scorecaster-green mb-2" />
        <h1 className="text-2xl font-bold text-scorecaster-text">Welcome to ScoreCaster</h1>
        <p className="text-gray-500">Sign in to predict and compete</p>
      </div>

      <form className="flex-1 flex flex-col w-full justify-center gap-4 text-scorecaster-text">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
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
            className="rounded-md px-4 py-2 bg-inherit border border-gray-300 focus:outline-none focus:ring-2 focus:ring-scorecaster-green"
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
          <div className={`p-3 rounded-md text-sm text-center ${isSuccessMessage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
            {searchParams.message}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <button
            formAction={login}
            className="bg-scorecaster-green hover:bg-green-700 text-white rounded-md px-4 py-2 font-medium transition-colors"
          >
            Sign In
          </button>
          <button
            formAction={signup}
            className="border border-scorecaster-green text-scorecaster-green hover:bg-green-50 rounded-md px-4 py-2 font-medium transition-colors"
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
  )
}