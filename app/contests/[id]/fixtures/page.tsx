import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Clock } from 'lucide-react'
import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches } from '../../../../lib/football'
import {
  getSeasonLengthDescriptionKey,
  isMatchInContestSeason,
  normalizeSeasonLength,
} from '../../../../lib/contest-season'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { ScoreBadge, StatPill } from '@/components/ui/badge'

export default async function FixturesPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: contest } = await supabase
    .from('contests')
    .select('season_length')
    .eq('id', id)
    .single()

  const seasonLength = normalizeSeasonLength(contest?.season_length)
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
      <PageHeader
        title={t('Premier League Fixtures')}
        description={t(getSeasonLengthDescriptionKey(seasonLength))}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-scorecaster-accent">
              <CalendarDays className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">{t('Fixture Calendar')}</span>
            </div>
            <StatPill label={t('Fixtures')} value={matches.length} className="hidden sm:inline-flex" />
          </div>
        }
      />

      {matchdays.length === 0 ? (
        <EmptyState title={t('No fixtures available for this season.')} />
      ) : (
        <div className="space-y-6">
          {matchdays.map((matchday) => (
            <section
              key={matchday}
              className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60"
            >
              <div className="flex items-center justify-between bg-zinc-950 px-4 py-3 text-zinc-100 sm:px-5 sm:py-4">
                <h3 className="font-black uppercase tracking-wider">
                  {t('Matchday')} {matchday}
                </h3>
                <span className="text-xs font-bold text-zinc-500">
                  {matches.filter((match: any) => Number(match.matchday) === matchday).length}{' '}
                  {t('fixtures')}
                </span>
              </div>
              <div className="divide-y divide-zinc-800">
                {matches
                  .filter((match: any) => Number(match.matchday) === matchday)
                  .map((match: any) => {
                    const score = match.score?.fullTime
                    const hasScore =
                      score?.home !== null &&
                      score?.home !== undefined &&
                      score?.away !== null &&
                      score?.away !== undefined
                    const homeName = match.homeTeam.shortName || match.homeTeam.name
                    const awayName = match.awayTeam.shortName || match.awayTeam.name
                    return (
                      <Link
                        key={match.id}
                        href={`/contests/${id}/predictions/${match.id}`}
                        className="fixture-calendar-game flex min-h-[72px] flex-col gap-3 px-4 py-4 transition-colors sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4 sm:px-5"
                      >
                        <span className="flex items-center gap-2 font-bold text-zinc-100 sm:justify-end sm:text-right">
                          {match.homeTeam.crest ? (
                            <Image
                              src={match.homeTeam.crest}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 object-contain sm:order-2"
                            />
                          ) : null}
                          <span className="truncate sm:order-1">{homeName}</span>
                        </span>

                        <span className="flex min-w-24 flex-col items-center gap-1 self-center">
                          {hasScore ? (
                            <ScoreBadge className="font-mono text-base">
                              {score.home} : {score.away}
                            </ScoreBadge>
                          ) : (
                            <span className="text-sm font-black text-scorecaster-accent">vs</span>
                          )}
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            <Clock className="h-3 w-3" />
                            {new Date(match.utcDate).toLocaleString(getServerLocale(), {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>

                        <span className="flex items-center gap-2 font-bold text-zinc-100">
                          {match.awayTeam.crest ? (
                            <Image
                              src={match.awayTeam.crest}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 object-contain"
                            />
                          ) : null}
                          <span className="truncate">{awayName}</span>
                        </span>
                      </Link>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="text-xs text-zinc-500">{t('Click a fixture to view and manage predictions.')}</p>
    </div>
  )
}
