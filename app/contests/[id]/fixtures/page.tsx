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
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:rounded-xl dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="border-b border-slate-200 bg-white px-5 py-4 text-zinc-900 dark:border-transparent dark:bg-zinc-950 dark:text-zinc-100">
        <h3 className="font-black uppercase tracking-wider">{title}</h3>
      </div>
      {sortedPlayers.length ? (
        sortedPlayers.map((player, index) => (
          <div
            key={`${player.player?.id || player.name}-${statKey}`}
            className="flex items-center justify-between border-b border-zinc-800 px-5 py-3 last:border-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-5 text-sm font-black text-xactscore-accent">{index + 1}</span>
              {player.team?.crest ? (
                <Image
                  src={player.team.crest}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              ) : null}
              <span className="truncate font-bold text-zinc-100">
                {player.player?.name || player.name}
              </span>
            </div>
            <span className="ml-3 shrink-0 font-black text-xactscore-accent">
              {player[statKey]}{' '}
              <span className="text-xs font-bold text-zinc-500">{statLabel}</span>
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
    getPLMatches(),
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
      className: 'text-center font-extrabold text-zinc-100',
      cell: (row) => row.position,
    },
    {
      key: 'club',
      header: t('Club'),
      mobilePrimary: true,
      cell: (row) => (
        <div className="flex items-center gap-3 font-bold text-zinc-100">
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
      className: 'text-center text-zinc-400',
      hideOnMobile: true,
      cell: (row) => row.playedGames,
    },
    {
      key: 'w',
      header: 'W',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      mobileExpandable: true,
      cell: (row) => row.won,
    },
    {
      key: 'd',
      header: 'D',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      mobileExpandable: true,
      cell: (row) => row.draw,
    },
    {
      key: 'l',
      header: 'L',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      mobileExpandable: true,
      cell: (row) => row.lost,
    },
    {
      key: 'gf',
      header: 'GF',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      mobileExpandable: true,
      cell: (row) => row.goalsFor,
    },
    {
      key: 'ga',
      header: 'GA',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      mobileExpandable: true,
      cell: (row) => row.goalsAgainst,
    },
    {
      key: 'gd',
      header: 'GD',
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      mobileExpandable: true,
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
        <h2 className="text-base font-black uppercase tracking-wider text-zinc-100 sm:text-xl">
          {t('Premier League Standings')}
        </h2>

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
              <span className="truncate text-[12px]">{row.team.shortName || row.team.name}</span>
            </span>
          )}
          mobileEnd={(row) => (
            <span className="text-[12px] font-black tabular-nums">{row.points}</span>
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
