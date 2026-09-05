import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateContestSettings, updateSeasonSettings, generateNewInviteKey, updateScoringSettings, deleteContest } from './actions'
import DeleteLeagueButton from '../DeleteLeagueButton'
import { Settings, Shield, Key, RefreshCw, Target, Trash2 } from 'lucide-react'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { normalizeSeasonLength } from '../../../../lib/contest-season'

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
    season_length: string;
    points_exact: number;
    points_close: number;
    points_result: number;
  }
  const seasonLength = normalizeSeasonLength(contest.season_length)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="rounded-xl bg-scorecaster-accent/10 p-2.5">
          <Settings className="h-6 w-6 text-scorecaster-accent" />
        </div>
        <PageHeader
          className="mb-0"
          title={t('Contest Settings')}
          description={t('Manage your league details, rules, and invites.')}
        />
      </div>

      {searchParams?.success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-300">
          <Shield className="h-4 w-4" /> {searchParams.success}
        </div>
      )}
      
      {searchParams?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
          {searchParams.error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h3 className="mb-4 text-lg font-extrabold uppercase tracking-tight text-zinc-100">
              {t('League Details')}
            </h3>
            <form action={updateContestSettings} className="space-y-4">
              <input type="hidden" name="contest_id" value={contest.id} />
              <div>
                <Label htmlFor="contest-name">{t('Contest Name')}</Label>
                <Input
                  id="contest-name"
                  type="text"
                  name="name"
                  defaultValue={contest.name}
                  required
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" className="uppercase tracking-wider">
                  {t('Save Name')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-scorecaster-accent" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-zinc-100">
                {t('Season Length')}
              </h3>
            </div>
            <p className="mb-6 text-xs leading-relaxed text-zinc-500">
              {t('Choose full season, first half, or second half of the Premier League.')}
            </p>
            <form action={updateSeasonSettings} className="space-y-4">
              <input type="hidden" name="contest_id" value={contest.id} />
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <input
                    type="radio"
                    name="season_length"
                    value="full"
                    defaultChecked={seasonLength === 'full'}
                    className="mt-1 accent-scorecaster-accent"
                  />
                  <span>
                    <span className="block font-bold text-zinc-100">{t('Full season')}</span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {t('All 38 Premier League matchdays.')}
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <input
                    type="radio"
                    name="season_length"
                    value="first_half"
                    defaultChecked={seasonLength === 'first_half'}
                    className="mt-1 accent-scorecaster-accent"
                  />
                  <span>
                    <span className="block font-bold text-zinc-100">{t('First half')}</span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {t('The first 19 Premier League matchdays.')}
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <input
                    type="radio"
                    name="season_length"
                    value="second_half"
                    defaultChecked={seasonLength === 'second_half'}
                    className="mt-1 accent-scorecaster-accent"
                  />
                  <span>
                    <span className="block font-bold text-zinc-100">{t('Second half')}</span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {t('Matchdays 20 through 38.')}
                    </span>
                  </span>
                </label>
              </div>
              <div className="mt-2 flex justify-end border-t border-zinc-800 pt-4">
                <Button type="submit" className="uppercase tracking-wider">
                  {t('Save Season Length')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-scorecaster-accent" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-zinc-100">
                {t('Scoring System')}
              </h3>
            </div>
            <p className="mb-6 text-xs leading-relaxed text-zinc-500">
              {t('Customize the points awarded. Exact and Result must be whole numbers. Close can use 0.5 increments.')}{' '}
              <strong className="text-zinc-300">{t('Maximum 5 points per category.')}</strong>
            </p>

            <form action={updateScoringSettings} className="space-y-4">
              <input type="hidden" name="contest_id" value={contest.id} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="points_exact">{t('Exact Score')}</Label>
                  <Input
                    id="points_exact"
                    type="number"
                    step="1"
                    min="0"
                    max="5"
                    name="points_exact"
                    defaultValue={contest.points_exact ?? 3}
                    required
                    className="font-mono font-bold"
                  />
                </div>

                <div>
                  <Label htmlFor="points_close">{t('Close Prediction')}</Label>
                  <Input
                    id="points_close"
                    type="number"
                    step="0.5"
                    min="0"
                    max="5"
                    name="points_close"
                    defaultValue={contest.points_close ?? 1.5}
                    required
                    className="font-mono font-bold"
                  />
                </div>

                <div>
                  <Label htmlFor="points_result">{t('Correct Result')}</Label>
                  <Input
                    id="points_result"
                    type="number"
                    step="1"
                    min="0"
                    max="5"
                    name="points_result"
                    defaultValue={contest.points_result ?? 1}
                    required
                    className="font-mono font-bold"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end border-t border-zinc-800 pt-4">
                <Button type="submit" className="uppercase tracking-wider">
                  {t('Save Scoring Rules')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-scorecaster-accent">
          <CardContent className="p-6 md:p-8">
            <div className="mb-2 flex items-center gap-2">
              <Key className="h-5 w-5 text-scorecaster-accent" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-zinc-100">
                {t('Secret Invite Key')}
              </h3>
            </div>
            <p className="mb-6 text-xs text-zinc-500">
              {t('Share this key with friends. If the key leaks, you can generate a new secure code below.')}
            </p>
            <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center shadow-inner">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {t('Current Active Key')}
              </span>
              <span className="font-mono text-3xl font-black tracking-widest text-scorecaster-accent md:text-4xl">
                {contest.contest_key}
              </span>
            </div>
            <form action={generateNewInviteKey}>
              <input type="hidden" name="contest_id" value={contest.id} />
              <div className="flex justify-end border-t border-zinc-800 pt-4">
                <Button type="submit" variant="glass" className="uppercase tracking-wider">
                  <RefreshCw className="h-4 w-4" />
                  {t('Generate New Key')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 md:p-8">
            <div className="mb-2 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-red-300">
                {t('Danger Zone')}
              </h3>
            </div>
            <p className="mb-5 text-xs text-red-300/80">
              {t(
                'Permanently delete this league and all of its members, predictions, and settings. This cannot be undone.'
              )}
            </p>
            <div className="flex justify-end">
              <DeleteLeagueButton action={deleteContest} contestId={contest.id} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
