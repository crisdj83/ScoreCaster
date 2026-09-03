import { Target, Activity, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default async function RulesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Contest Rules & Scoring</h2>
        <p className="text-gray-500 text-sm mt-0.5">Everything you need to know to dominate the leaderboard.</p>
      </div>

      <div className="space-y-6">
        
        {/* Section 1: How to Play */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-lg">
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-gray-900 mb-4 flex items-center gap-2.5">
            <div className="bg-orange-500/10 p-2 rounded-xl">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            How to Play
          </h3>
          <ul className="space-y-3 text-gray-600 text-sm ml-7 list-disc marker:text-orange-500 font-medium">
            <li>Navigate to the <strong className="text-gray-900">Predictions</strong> tab to see the upcoming Premier League fixtures.</li>
            <li>Use the <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs font-bold text-gray-800 border border-gray-200">+</span> and <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs font-bold text-gray-800 border border-gray-200">-</span> buttons to set your predicted score for the Home and Away teams.</li>
            <li>Your predictions are saved automatically as you change them.</li>
            <li><strong className="text-gray-900">Lockout Time:</strong> You can change your prediction as many times as you want up until the exact minute the match kicks off. Once a match begins, predictions are locked.</li>
          </ul>
        </div>

        {/* Section 2: The Custom Tiered Scoring System */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-lg">
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-gray-900 mb-3 flex items-center gap-2.5">
            <div className="bg-orange-500/10 p-2 rounded-xl">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            Tiered Scoring System
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Points are awarded after the final whistle based on how accurate your prediction was compared to the real-world result.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Exact Card */}
            <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-orange-500 transition-all flex flex-col">
              <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow">
                +3 PTS
              </div>
              <Target className="h-7 w-7 text-orange-600 mb-3" />
              <h4 className="font-extrabold uppercase tracking-tight text-gray-900 mb-1.5">Exact Score</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                You correctly predict the exact final score of the match.
              </p>
              <div className="mt-auto pt-4 bg-white p-3 rounded-xl border border-gray-200 text-xs text-gray-500 shadow-inner">
                <span className="block font-extrabold uppercase tracking-wider text-gray-700 mb-1">Example:</span>
                Predicted: 2 - 1 <br />
                Actual: 2 - 1
              </div>
            </div>

            {/* Close Card */}
            <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-purple-600 transition-all flex flex-col">
              <div className="absolute top-0 right-0 bg-purple-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow">
                +1.5 PTS
              </div>
              <Activity className="h-7 w-7 text-purple-700 mb-3" />
              <h4 className="font-extrabold uppercase tracking-tight text-gray-900 mb-1.5">Close Prediction</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                You predict the right outcome (Win/Draw/Loss), AND total goals scored is off by no more than 1.
              </p>
              <div className="mt-auto pt-4 bg-white p-3 rounded-xl border border-gray-200 text-xs text-gray-500 shadow-inner">
                <span className="block font-extrabold uppercase tracking-wider text-gray-700 mb-1">Example:</span>
                Predicted: 1 - 0 (Total: 1) <br />
                Actual: 2 - 0 (Total: 2)
              </div>
            </div>

            {/* Result Card */}
            <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-gray-500 transition-all flex flex-col">
              <div className="absolute top-0 right-0 bg-gray-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow">
                +1 PT
              </div>
              <CheckCircle2 className="h-7 w-7 text-gray-700 mb-3" />
              <h4 className="font-extrabold uppercase tracking-tight text-gray-900 mb-1.5">Correct Result</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                You predict the right outcome (Win/Draw/Loss), but total goals are not close.
              </p>
              <div className="mt-auto pt-4 bg-white p-3 rounded-xl border border-gray-200 text-xs text-gray-500 shadow-inner">
                <span className="block font-extrabold uppercase tracking-wider text-gray-700 mb-1">Example:</span>
                Predicted: 1 - 0 (Total: 1)<br />
                Actual: 4 - 0 (Total: 4)
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Tiebreakers */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-lg">
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-gray-900 mb-3 flex items-center gap-2.5">
            <div className="bg-orange-500/10 p-2 rounded-xl">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            Leaderboard Tiebreakers
          </h3>
          <p className="text-gray-500 text-sm mb-4">If two or more players have the exact same Total Points, the leaderboard will rank them based on:</p>
          <ol className="space-y-2 text-sm text-gray-700 ml-7 list-decimal marker:text-orange-600 font-bold">
            <li>Highest number of Exact Scores (+3 pts)</li>
            <li>Highest number of Close Predictions (+1.5 pts)</li>
            <li>Highest overall prediction accuracy percentage</li>
          </ol>
        </div>

      </div>
    </div>
  )
}