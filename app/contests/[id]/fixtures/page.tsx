import Image from 'next/image'
import { createClient } from '../../../../lib/supabase/server'
import { getPLMatches, getPLScorers, getPLStandings } from '../../../../lib/football'
import { getMatchVenues, getPlTopScorers } from '../../../../lib/goal-api'
import {
  isMatchInContestSeason,
  normalizeSeasonLength,
} from '../../../../lib/contest-season'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { EmptyState } from '@/components/ui/page-header'
import { ScoreBadge } from '@/components/ui/badge'
import { RankTable, type RankColumn } from '@/components/ui/rank-table'
import FixturesCalendar from './FixturesCalendar'

type StandingRow = {
  position: number
  team: { id: number; name: string; shortName?: string; crest?: string }
  playedGames: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

function formatGoalDifference(value: number) {
  if (value > 0) return `+${value}`
  return String(value)
}

function ScorerCard({
  title,
  players,
  statKey,
  statLabel,
}: {
  title: string
  players: any[]
  statKey: 'goals' | 'assists'
  statLabel: string
}) {
  const sortedPlayers = [...players]
    .filter((player) => typeof player[statKey] === 'number')
    .sort((a, b) => b[statKey] - a[statKey])
    .slice(0, 5)

  return (
    <section className="content-panel overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-5 py-4 text-zinc-900 dark:border-transparent dark:bg-zinc-950 dark:text-zinc-100">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:font-black dark:text-zinc-100">{title}</h3>
      </div>
      {sortedPlayers.length ? (
        sortedPlayers.map((player, index) => (
          <div
            key={`${player.player?.id || player.name}-${statKey}`}
            className="flex items-center justify-between border-b border-zinc-800 px-5 py-3 last:border-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-5 text-sm font-semibold text-xactscore-accent dark:font-black">{index + 1}</span>
              {player.team?.crest ? (
                <Image
                  src={player.team.crest}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              ) : null}
              <span className="min-w-0 break-words text-sm font-medium text-slate-900 dark:font-bold dark:text-zinc-100">
                {player.player?.name || player.name}
              </span>
            </div>
            <span className="ml-3 shrink-0 font-semibold text-xactscore-accent dark:font-black">
              {player[statKey]}{' '}
              <span className="text-xs font-semibold text-slate-500 dark:font-bold dark:text-zinc-500">{statLabel}</span>
            </span>
          </div>
        ))
      ) : (
        <p className="px-5 py-6 text-sm text-zinc-500">Statistics unavailable.</p>
      )}
    </section>
  )
}

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
  const [data, standingsData, footballScorers, goalScorers] = await Promise.all([
    getPLMatches().catch(() => ({ matches: [] })),
    getPLStandings().catch(() => null),
    getPLScorers().catch(() => ({ scorers: [] as Array<Record<string, unknown>> })),
    getPlTopScorers().catch(() => ({ scorers: [] })),
  ])

  const matches = (data.matches || [])
    .filter((match: any) => isMatchInContestSeason(match, seasonLength))
    .sort((a: any, b: any) => (
      Number(a.matchday) - Number(b.matchday) ||
      new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    ))
  const venues = await getMatchVenues(matches)
  const scorerData = goalScorers.scorers.length ? goalScorers : footballScorers
  const matchesWithVenue = matches.map((match: any) => ({
    ...match,
    venue: venues.get(String(match.id)) || null,
  }))

  const matchdays: number[] = Array.from(new Set<number>(matchesWithVenue.map((match: any) => Number(match.matchday))))

  const standingsTable: StandingRow[] =
    standingsData?.standings?.find((standing: { type?: string }) => standing.type === 'TOTAL')?.table ||
    standingsData?.standings?.[0]?.table ||
    []

  const standingsColumns: RankColumn<StandingRow>[] = [
    {
      key: 'pos',
      header: '#',
      headerClassName: 'text-center w-14',
      className: 'text-center font-semibold text-slate-900 dark:font-extrabold dark:text-zinc-100',
      cell: (row) => row.position,
    },
    {
      key: 'club',
      header: t('Club'),
      mobilePrimary: true,
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3 text-sm font-medium text-slate-900 dark:font-bold dark:text-zinc-100">
          {row.team.crest ? (
            <Image src={row.team.crest} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
          ) : null}
          {row.team.shortName || row.team.name}
        </div>
      ),
    },
    {
      key: 'mp',
      header: 'MP',
      headerClassName: 'text-center',
      className: 'text-center text-slate-500 dark:text-zinc-400',
      hideOnMobile: true,
      cell: (row) => row.playedGames,
    },
    {
      key: 'w',
      header: 'W',
      headerClassName: 'text-center',
      className: 'text-center text-slate-500 dark:text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.won,
    },
    {
      key: 'd',
      header: 'D',
      headerClassName: 'text-center',
      className: 'text-center text-slate-500 dark:text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.draw,
    },
    {
      key: 'l',
      header: 'L',
      headerClassName: 'text-center',
      className: 'text-center text-slate-500 dark:text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.lost,
    },
    {
      key: 'gf',
      header: 'GF',
      headerClassName: 'text-center',
      className: 'text-center text-slate-500 dark:text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.goalsFor,
    },
    {
      key: 'ga',
      header: 'GA',
      headerClassName: 'text-center',
      className: 'text-center text-slate-500 dark:text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.goalsAgainst,
    },
    {
      key: 'gd',
      header: 'GD',
      headerClassName: 'text-center',
      className: 'text-center font-semibold text-slate-500 dark:font-bold dark:text-zinc-200',
      hideOnMobile: true,
      cell: (row) => row.goalDifference,
    },
    {
      key: 'pts',
      header: 'Pts',
      headerClassName: 'text-center text-xactscore-accent',
      className: 'text-center',
      cell: (row) => <ScoreBadge>{row.points}</ScoreBadge>,
    },
  ]

  return (
    <div className="space-y-6">
      {matchdays.length === 0 ? (
        <EmptyState title={t('No fixtures available for this season.')} />
      ) : (
        <FixturesCalendar matches={matchesWithVenue} contestId={id} locale={getServerLocale()} />
      )}
      <p className="text-xs text-zinc-500">{t('Click a fixture to view and manage predictions.')}</p>

      <section className="space-y-6 pt-6 border-t border-zinc-800">
        <h2 className="text-xl font-semibold uppercase tracking-tight text-slate-900 dark:text-base dark:font-black dark:tracking-wider dark:text-zinc-100 sm:dark:text-xl">
          {t('Premier League Standings')}
        </h2>
        <div className="flex items-center gap-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 md:hidden dark:text-zinc-500">
          <span className="flex min-w-6 justify-center">#</span>
          <span className="min-w-0 flex-1">{t('Club')}</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-[3.4rem] text-center">W-D-L</span>
            <span className="w-7 text-right">GD</span>
          </span>
          <span className="min-w-[1.75rem] text-right">Pts</span>
        </div>
        <RankTable
          rows={standingsTable}
          columns={standingsColumns}
          getRowKey={(row) => String(row.team.id)}
          emptyMessage={t('No fixtures available for this season.')}
          mobileSingleLine
          mobileRank={(row) => (
            <span className="w-4 text-center text-[11px] font-bold tabular-nums text-zinc-400">
              {row.position}
            </span>
          )}
          mobileTitle={(row) => (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              {row.team.crest ? (
                <Image
                  src={row.team.crest}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0 object-contain"
                />
              ) : null}
              <span className="min-w-0 truncate text-sm font-medium">{row.team.shortName || row.team.name}</span>
            </span>
          )}
          mobileStats={(row) => (
            <span className="inline-flex items-center gap-1">
              <span className="w-[3.4rem] text-center text-[10px] font-semibold tabular-nums text-slate-500 dark:text-zinc-400" title="W-D-L">
                {row.won}-{row.draw}-{row.lost}
              </span>
              <span
                className={`w-7 text-right text-[10px] font-semibold tabular-nums ${
                  row.goalDifference > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : row.goalDifference < 0
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-slate-500 dark:text-zinc-400'
                }`}
                title="GD"
              >
                {formatGoalDifference(row.goalDifference)}
              </span>
            </span>
          )}
          mobileEnd={(row) => (
            <span className="text-sm font-semibold tabular-nums dark:text-[12px] dark:font-black">{row.points}</span>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <ScorerCard
            title={t('Top 5 scorers')}
            players={scorerData.scorers || []}
            statKey="goals"
            statLabel={t('goals')}
          />
          <ScorerCard
            title={t('Top 5 assists')}
            players={scorerData.scorers || []}
            statKey="assists"
            statLabel={t('assists')}
          />
        </div>
      </section>
    </div>
  )
}
