import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateContestSettings, updateSeasonSettings, generateNewInviteKey, updateScoringSettings, deleteContest } from './actions'
import DeleteLeagueButton from '../DeleteLeagueButton'
import { Settings, Shield, Key, RefreshCw, Target, Trash2 } from 'lucide-react'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'

export default async function EditContestPage(props: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ success?: string, error?: string }> 
}) {
  const params = await props.params;
  const t = getTranslations(getServerLocale())
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members')
    .select(`
      role,
      contests (
        id,
        name,
        contest_key,
        season_length,
        points_exact,
        points_close,
        points_result
      )
    `)
    .eq('contest_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership || membership.role !== 'admin') {
    redirect(`/contests/${params.id}/predictions?error=You must be an admin to view settings.`)
  }

  const contest = membership.contests as unknown as {
    id: string;
    name: string;
    contest_key: string;
    season_length: 'full' | 'half';
    points_exact: number;
    points_close: number;
    points_result: number;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-2 flex items-center gap-3">
        <div className="bg-orange-500/10 p-2.5 rounded-xl">
          <Settings className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">{t('Contest Settings')}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{t('Manage your league details, rules, and invites.')}</p>
        </div>
      </div>

      {searchParams?.success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm">
          <Shield className="h-4 w-4" /> {searchParams.success}
        </div>
      )}
      
      {searchParams?.error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium shadow-sm">
          {searchParams.error}
        </div>
      )}

      <div className="space-y-6">
        
        {/* FORM 1: Update Contest Name */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-lg">
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-gray-900 mb-4">{t('League Details')}</h3>
          <form action={updateContestSettings} className="space-y-4">
            <input type="hidden" name="contest_id" value={contest.id} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">{t('Contest Name')}</label>
              <input 
                type="text" 
                name="name" 
                defaultValue={contest.name}
                required
                className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 font-medium"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-3 font-black uppercase tracking-wider text-xs transition-colors shadow-md">
                {t('Save Name')}
              </button>
            </div>
          </form>
        </div>

        {/* FORM 2: Season Length */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-extrabold uppercase tracking-tight text-gray-900">{t('Season Length')}</h3>
          </div>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">{t('Choose whether this contest uses the full Premier League season or only the first half.')}</p>
          <form action={updateSeasonSettings} className="space-y-4">
            <input type="hidden" name="contest_id" value={contest.id} />
            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 cursor-pointer">
                <input type="radio" name="season_length" value="full" defaultChecked={contest.season_length !== 'half'} className="mt-1 accent-orange-600" />
                <span>
                  <span className="block font-bold text-gray-900">{t('Full season')}</span>
                  <span className="block text-xs text-gray-500 mt-1">{t('All 38 Premier League matchdays.')}</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 cursor-pointer">
                <input type="radio" name="season_length" value="half" defaultChecked={contest.season_length === 'half'} className="mt-1 accent-orange-600" />
                <span>
                  <span className="block font-bold text-gray-900">{t('Half season')}</span>
                  <span className="block text-xs text-gray-500 mt-1">{t('The first 19 Premier League matchdays.')}</span>
                </span>
              </label>
            </div>
            <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
              <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-3 font-black uppercase tracking-wider text-xs transition-colors shadow-md">
                {t('Save Season Length')}
              </button>
            </div>
          </form>
        </div>

        {/* FORM 2: Custom Scoring System */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-extrabold uppercase tracking-tight text-gray-900">{t('Scoring System')}</h3>
          </div>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {t('Customize the points awarded. Exact and Result must be whole numbers. Close can use 0.5 increments.')} <strong className="text-gray-800">{t('Maximum 5 points per category.')}</strong>
          </p>

          <form action={updateScoringSettings} className="space-y-4">
            <input type="hidden" name="contest_id" value={contest.id} />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">{t('Exact Score')}</label>
                <input type="number" step="1" min="0" max="5" name="points_exact" defaultValue={contest.points_exact ?? 3} required
                  className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono bg-gray-50 font-bold" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">{t('Close Prediction')}</label>
                <input type="number" step="0.5" min="0" max="5" name="points_close" defaultValue={contest.points_close ?? 1.5} required
                  className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono bg-gray-50 font-bold" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">{t('Correct Result')}</label>
                <input type="number" step="1" min="0" max="5" name="points_result" defaultValue={contest.points_result ?? 1} required
                  className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono bg-gray-50 font-bold" />
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
              <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-3 font-black uppercase tracking-wider text-xs transition-colors shadow-md">
                {t('Save Scoring Rules')}
              </button>
            </div>
          </form>
        </div>

        {/* FORM 3: Generate Random Invite Key */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-lg border-l-4 border-l-orange-500">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-extrabold uppercase tracking-tight text-gray-900">{t('Secret Invite Key')}</h3>
          </div>
          <p className="text-xs text-gray-500 mb-6">
            {t('Share this key with friends. If the key leaks, you can generate a new secure code below.')}
          </p>
          <div className="bg-gray-950 text-white p-6 rounded-2xl border border-gray-800 text-center mb-6 shadow-inner">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-2">{t('Current Active Key')}</span>
            <span className="text-3xl md:text-4xl font-mono font-black text-[#d4ff00] tracking-widest">{contest.contest_key}</span>
          </div>
          <form action={generateNewInviteKey}>
            <input type="hidden" name="contest_id" value={contest.id} />
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 py-3 font-black uppercase tracking-wider text-xs transition-colors shadow-md">
                <RefreshCw className="h-4 w-4" />
                {t('Generate New Key')}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-red-50 p-6 md:p-8 rounded-2xl border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-extrabold uppercase tracking-tight text-red-900">{t('Danger Zone')}</h3>
          </div>
          <p className="text-xs text-red-700 mb-5">
            {t('Permanently delete this league and all of its members, predictions, and settings. This cannot be undone.')}
          </p>
          <div className="flex justify-end">
            <DeleteLeagueButton action={deleteContest} contestId={contest.id} />
          </div>
        </div>

      </div>
    </div>
  )
}