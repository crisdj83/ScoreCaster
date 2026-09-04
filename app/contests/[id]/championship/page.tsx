import { getPLScorers, getPLStandings } from '../../../../lib/football'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'

export default async function ChampionshipPage() {
  const t = getTranslations(getServerLocale())
  // Fetch the live standings from our function
  const [data, scorerData] = await Promise.all([
    getPLStandings(),
    getPLScorers().catch(() => ({ scorers: [] })),
  ])
  
  // The API returns different types of standings (Home, Away, Total). 
  // We want the 'TOTAL' table, which is always the first one in the array.
  const table = data.standings[0].table

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">{t('Premier League Standings')}</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-gray-950 text-white font-black uppercase tracking-wider text-xs">
            <tr>
              <th className="px-5 py-4 text-center w-14">#</th>
              <th className="px-4 py-4">{t('Club')}</th>
              <th className="px-3 py-4 text-center">MP</th>
              <th className="px-3 py-4 text-center">W</th>
              <th className="px-3 py-4 text-center">D</th>
              <th className="px-3 py-4 text-center">L</th>
              <th className="px-3 py-4 text-center">GF</th>
              <th className="px-3 py-4 text-center">GA</th>
              <th className="px-3 py-4 text-center">GD</th>
              <th className="px-4 py-4 text-center font-black text-orange-400">Pts</th>
              <th className="px-5 py-4 text-center w-36">{t('Form')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {table.map((row: any) => (
              <tr key={row.team.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-5 py-3.5 text-center font-extrabold text-gray-900">
                  {row.position}
                </td>
                <td className="px-4 py-3.5 flex items-center gap-3 font-bold text-gray-900">
                  <img src={row.team.crest} alt={row.team.name} className="w-6 h-6 object-contain" />
                  {row.team.shortName || row.team.name}
                </td>
                <td className="px-3 py-3.5 text-center text-gray-500">{row.playedGames}</td>
                <td className="px-3 py-3.5 text-center text-gray-600">{row.won}</td>
                <td className="px-3 py-3.5 text-center text-gray-600">{row.draw}</td>
                <td className="px-3 py-3.5 text-center text-gray-600">{row.lost}</td>
                <td className="px-3 py-3.5 text-center text-gray-600">{row.goalsFor}</td>
                <td className="px-3 py-3.5 text-center text-gray-600">{row.goalsAgainst}</td>
                <td className="px-3 py-3.5 text-center font-bold text-gray-800">{row.goalDifference}</td>
                <td className="px-4 py-3.5 text-center font-black text-orange-600 text-base">
                  {row.points}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {row.form ? row.form.split(',').map((result: string, index: number) => {
                      let bgColor = 'bg-gray-300';
                      if (result === 'W') bgColor = 'bg-green-600';
                      if (result === 'D') bgColor = 'bg-amber-500';
                      if (result === 'L') bgColor = 'bg-red-600';
                      
                      return (
                        <div 
                          key={index} 
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white shadow-sm ${bgColor}`}
                          title={result}
                        >
                          {result}
                        </div>
                      )
                    }) : <span className="text-gray-400 text-xs">-</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ScorerCard title={t('Top 5 scorers')} players={scorerData.scorers || []} statKey="goals" statLabel={t('goals')} />
        <ScorerCard title={t('Top 5 assists')} players={scorerData.scorers || []} statKey="assists" statLabel={t('assists')} />
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
    .filter(player => typeof player[statKey] === 'number')
    .sort((a, b) => b[statKey] - a[statKey])
    .slice(0, 5)

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <div className="bg-gray-950 px-5 py-4 text-white">
        <h3 className="font-black uppercase tracking-wider">{title}</h3>
      </div>
      {sortedPlayers.length ? sortedPlayers.map((player, index) => (
        <div key={`${player.player?.id || player.name}-${statKey}`} className="flex items-center justify-between border-b border-gray-100 px-5 py-3 last:border-0">
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-5 text-sm font-black text-orange-500">{index + 1}</span>
            {player.team?.crest && <img src={player.team.crest} alt="" className="h-7 w-7 object-contain" />}
            <span className="truncate font-bold text-gray-900">{player.player?.name || player.name}</span>
          </div>
          <span className="ml-3 shrink-0 font-black text-orange-600">{player[statKey]} <span className="text-xs font-bold text-gray-500">{statLabel}</span></span>
        </div>
      )) : <p className="px-5 py-6 text-sm text-gray-500">Statistics unavailable.</p>}
    </section>
  )
}