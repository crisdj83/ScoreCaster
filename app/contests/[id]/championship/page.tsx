import Image from 'next/image'
import { getPLScorers, getPLStandings } from '../../../../lib/football'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { RankTable, type RankColumn } from '@/components/ui/rank-table'
import { PageHeader } from '@/components/ui/page-header'
import { ScoreBadge } from '@/components/ui/badge'

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
  form?: string
}

function FormPills({ form }: { form?: string }) {
  if (!form) return <span className="text-xs text-zinc-500">-</span>
  return (
    <div className="flex items-center justify-center gap-1">
      {form.split(',').map((result: string, index: number) => {
        let bgColor = 'bg-zinc-600'
        if (result === 'W') bgColor = 'bg-emerald-600'
        if (result === 'D') bgColor = 'bg-amber-500'
        if (result === 'L') bgColor = 'bg-red-600'
        return (
          <div
            key={index}
            className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black text-white ${bgColor}`}
            title={result}
          >
            {result}
          </div>
        )
      })}
    </div>
  )
}

export default async function ChampionshipPage() {
  const t = getTranslations(getServerLocale())
  const [data, scorerData] = await Promise.all([
    getPLStandings(),
    getPLScorers().catch(() => ({ scorers: [] })),
  ])

  const table: StandingRow[] =
    data.standings?.find((standing: { type?: string }) => standing.type === 'TOTAL')?.table ||
    data.standings?.[0]?.table ||
    []

  const columns: RankColumn<StandingRow>[] = [
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
      hideOnMobile: true,
      cell: (row) => row.won,
    },
    {
      key: 'd',
      header: 'D',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.draw,
    },
    {
      key: 'l',
      header: 'L',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.lost,
    },
    {
      key: 'gf',
      header: 'GF',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.goalsFor,
    },
    {
      key: 'ga',
      header: 'GA',
      headerClassName: 'text-center',
      className: 'text-center text-zinc-300',
      hideOnMobile: true,
      cell: (row) => row.goalsAgainst,
    },
    {
      key: 'gd',
      header: 'GD',
      headerClassName: 'text-center',
      className: 'text-center font-bold text-zinc-200',
      cell: (row) => row.goalDifference,
    },
    {
      key: 'pts',
      header: 'Pts',
      headerClassName: 'text-center text-scorecaster-accent',
      className: 'text-center',
      cell: (row) => <ScoreBadge>{row.points}</ScoreBadge>,
    },
    {
      key: 'form',
      header: t('Form'),
      headerClassName: 'text-center',
      className: 'text-center',
      cell: (row) => <FormPills form={row.form} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('Premier League Standings')} />

      <RankTable
        rows={table}
        columns={columns}
        getRowKey={(row) => String(row.team.id)}
        emptyMessage={t('No fixtures available for this season.')}
        mobileTitle={(row) => (
          <span className="inline-flex items-center gap-2">
            <span className="font-mono text-scorecaster-accent">#{row.position}</span>
            {row.team.shortName || row.team.name}
          </span>
        )}
        mobileSubtitle={(row) => `${row.playedGames} MP · GD ${row.goalDifference}`}
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
    </div>
  )
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
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="bg-zinc-950 px-5 py-4 text-zinc-100">
        <h3 className="font-black uppercase tracking-wider">{title}</h3>
      </div>
      {sortedPlayers.length ? (
        sortedPlayers.map((player, index) => (
          <div
            key={`${player.player?.id || player.name}-${statKey}`}
            className="flex items-center justify-between border-b border-zinc-800 px-5 py-3 last:border-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-5 text-sm font-black text-scorecaster-accent">{index + 1}</span>
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
            <span className="ml-3 shrink-0 font-black text-scorecaster-accent">
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
