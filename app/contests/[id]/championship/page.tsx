import { getPLStandings } from '../../../../lib/football'

export default async function ChampionshipPage() {
  // Fetch the live standings from our function
  const data = await getPLStandings()
  
  // The API returns different types of standings (Home, Away, Total). 
  // We want the 'TOTAL' table, which is always the first one in the array.
  const table = data.standings[0].table

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Premier League Standings</h2>
        <p className="text-gray-500 text-sm mt-0.5">Live official championship table powered by your API.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-gray-950 text-white font-black uppercase tracking-wider text-xs">
            <tr>
              <th className="px-5 py-4 text-center w-14">#</th>
              <th className="px-4 py-4">Club</th>
              <th className="px-3 py-4 text-center">MP</th>
              <th className="px-3 py-4 text-center">W</th>
              <th className="px-3 py-4 text-center">D</th>
              <th className="px-3 py-4 text-center">L</th>
              <th className="px-3 py-4 text-center">GF</th>
              <th className="px-3 py-4 text-center">GA</th>
              <th className="px-3 py-4 text-center">GD</th>
              <th className="px-4 py-4 text-center font-black text-orange-400">Pts</th>
              <th className="px-5 py-4 text-center w-36">Form</th>
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
    </div>
  )
}