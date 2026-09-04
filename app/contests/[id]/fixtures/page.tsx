import Link from 'next/link'
import { CalendarDays, Clock, Trophy } from 'lucide-react'
import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches } from '../../../../lib/football'
import { isMatchInContestSeason } from '../../../../lib/contest-season'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'

export default async function FixturesPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: contest } = await supabase
    .from('contests')
    .select('season_length')
    .eq('id', id)
    .single()

  const seasonLength = contest?.season_length === 'half' ? 'half' : 'full'
  const data = await getPLMatches()
  const matches = data.matches
    .filter((match: any) => isMatchInContestSeason(match, seasonLength))
    .sort((a: any, b: any) => (
      Number(a.matchday) - Number(b.matchday) ||
      new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    ))

  const matchdays: number[] = Array.from(new Set<number>(matches.map((match: any) => Number(match.matchday))))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-orange-600">
            <CalendarDays className="h-6 w-6" />
            <span className="text-xs font-black uppercase tracking-widest">{t('Fixture Calendar')}</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">{t('Premier League Fixtures')}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {seasonLength === 'half' ? t('Half season — first 19 matchdays') : t('Full season — all 38 matchdays')}
          </p>
        </div>
        <div className="hidden rounded-xl bg-gray-950 px-4 py-3 text-center text-white sm:block">
          <Trophy className="mx-auto mb-1 h-5 w-5 text-[#d4ff00]" />
          <span className="block text-lg font-black">{matches.length}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('Fixtures')}</span>
        </div>
      </div>

      {matchdays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
          {t('No fixtures available for this season.')}
        </div>
      ) : (
        <div className="space-y-6">
          {matchdays.map(matchday => (
            <section key={matchday} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-gray-950 px-5 py-4 text-white">
                <h3 className="font-black uppercase tracking-wider">{t('Matchday')} {matchday}</h3>
                <span className="text-xs font-bold text-gray-400">
                  {matches.filter((match: any) => Number(match.matchday) === matchday).length} {t('fixtures')}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {matches.filter((match: any) => Number(match.matchday) === matchday).map((match: any) => {
                  const score = match.score?.fullTime
                  const hasScore = score?.home !== null && score?.home !== undefined && score?.away !== null && score?.away !== undefined
                  return (
                    <Link
                      key={match.id}
                      href={`/contests/${id}/predictions/${match.id}`}
                      className="fixture-calendar-game grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 transition-colors sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
                    >
                      <span className="flex items-center justify-end gap-2 text-right font-bold text-gray-900">
                        <span className="truncate">{match.homeTeam.shortName || match.homeTeam.name}</span>
                        {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="h-7 w-7 object-contain" />}
                      </span>
                      <span className="flex min-w-24 flex-col items-center gap-1">
                        {hasScore ? (
                          <span className="font-mono text-lg font-black text-gray-900">{score.home} : {score.away}</span>
                        ) : (
                          <span className="text-sm font-black text-orange-600">—</span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          <Clock className="h-3 w-3" />
                          {new Date(match.utcDate).toLocaleString(getServerLocale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 font-bold text-gray-900">
                        {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="h-7 w-7 object-contain" />}
                        <span className="truncate">{match.awayTeam.shortName || match.awayTeam.name}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500">{t('Click a fixture to view and manage predictions.')}</p>
    </div>
  )
}
