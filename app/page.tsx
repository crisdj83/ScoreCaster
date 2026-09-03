import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from './actions'
import { Trophy, ChevronRight, ShieldCheck, User as UserIcon, LogOut, Home as HomeIcon } from 'lucide-react'
import HeroBanner from './components/HeroBanner'

const TEAMS = [
  { name: 'Arsenal', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
  { name: 'Aston Villa', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png' },
  { name: 'Bournemouth', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png' },
  { name: 'Brentford', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png' },
  { name: 'Brighton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png' },
  { name: 'Chelsea', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' },
  { name: 'Crystal Palace', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png' },
  { name: 'Everton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png' },
  { name: 'Fulham', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png' },
  { name: 'Ipswich Town', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/379.png' },
  { name: 'Leicester City', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png' },
  { name: 'Liverpool', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png' },
  { name: 'Manchester City', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png' },
  { name: 'Manchester United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' },
  { name: 'Newcastle United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png' },
  { name: 'Nottingham Forest', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png' },
  { name: 'Southampton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png' },
  { name: 'Tottenham Hotspur', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png' },
  { name: 'West Ham United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png' },
  { name: 'Wolverhampton Wanderers', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png' }
]

// Fetch both the recent scores AND the next scheduled match
async function fetchPLData() {
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/PL/matches', {
      headers: {
        'X-Auth-Token': '4551c62e82d64b21b63b63d343ed85e6'
      },
      next: { revalidate: 60 } 
    });

    if (!res.ok) throw new Error('Failed to fetch from API');

    const data = await res.json();

    // 1. Get the Recent Scores (Finished or Live)
    const recentMatchesRaw = data.matches
      .filter((m: any) => ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(m.status))
      .sort((a: any, b: any) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, 8);

    const recentScores = recentMatchesRaw.map((m: any) => ({
      id: m.id,
      homeTeam: m.homeTeam.shortName || m.homeTeam.name,
      awayTeam: m.awayTeam.shortName || m.awayTeam.name,
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
      status: m.status === 'FINISHED' ? 'FT' : 'LIVE'
    }));

    // 2. Get the Next Upcoming Match
    const nextMatchRaw = data.matches
      .filter((m: any) => ['SCHEDULED', 'TIMED'].includes(m.status))
      // Sort ascending to get the closest future match
      .sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];

    let nextMatch = null;
    if (nextMatchRaw) {
      nextMatch = {
        date: nextMatchRaw.utcDate,
        homeTeam: nextMatchRaw.homeTeam.shortName || nextMatchRaw.homeTeam.name,
        awayTeam: nextMatchRaw.awayTeam.shortName || nextMatchRaw.awayTeam.name,
      }
    }

    return { recentScores, nextMatch };
  } catch (error) {
    console.error("API Fetch Error:", error);
    return { recentScores: [], nextMatch: null };
  }
}

export default async function Home() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: myContests } = await supabase
    .from('contest_members')
    .select(`
      contest_id,
      role,
      contests (
        name,
        contest_key
      )
    `)
    .eq('user_id', user.id)

  const selectedTeamData = TEAMS.find(t => t.name === profile?.favorite_team)
  
  // Fetch data
  const { recentScores, nextMatch } = await fetchPLData();

  return (
    <div className="space-y-8 pb-12">
      
      {/* NEW CENTERED PILL NAVIGATION HEADER */}
      <div className="flex flex-col items-center gap-6 pt-4 pb-2">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase">
          ScoreCaster
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link 
            href="/" 
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-sm"
          >
            <HomeIcon className="h-4 w-4" /> Dashboard
          </Link>
          
          <Link 
            href="/contests" 
            className="flex items-center gap-2 bg-white text-gray-800 border border-gray-200 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Trophy className="h-4 w-4" /> Contests
          </Link>
          
          <Link 
            href="/profile" 
            className="flex items-center gap-2 bg-white text-gray-800 border border-gray-200 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <UserIcon className="h-4 w-4" /> Profile
          </Link>
          
          {profile?.is_global_admin && (
            <Link 
              href="/admin" 
              className="flex items-center gap-2 bg-purple-100 text-purple-800 border border-purple-200 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-purple-200 transition-colors shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          
          <form action={signOut}>
            <button 
              className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors shadow-sm"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* HeroBanner is fully driven by the real API */}
      <HeroBanner nextMatch={nextMatch} recentScores={recentScores} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-scorecaster-card p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-scorecaster-text">Your Profile</h2>
            <Link href="/profile" className="text-xs text-scorecaster-green hover:underline font-medium">Edit</Link>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="h-12 w-12 rounded-full object-cover border border-gray-200 bg-gray-50"
              />
            ) : (
              <div className="rounded-full bg-scorecaster-green text-white h-12 w-12 flex items-center justify-center font-bold text-lg">
                {profile?.username ? profile.username.charAt(0).toUpperCase() : profile?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-scorecaster-text">{profile?.username || 'No username set'}</p>
                {profile?.is_global_admin && (
                  <span title="Global Admin" className="flex items-center">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate max-w-[150px]">{profile?.email}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            <div className="text-sm text-gray-600 flex justify-between items-center">
              <span className="font-medium text-gray-500">Favorite Team:</span> 
              
              <div className="flex items-center gap-2">
                {selectedTeamData && (
                  <img 
                    src={selectedTeamData.crest} 
                    alt={`${selectedTeamData.name} Logo`} 
                    className="h-5 w-5 object-contain"
                  />
                )}
                <span className="font-semibold text-scorecaster-text">
                  {profile?.favorite_team || 'Not selected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-scorecaster-card p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-scorecaster-text">My Contests</h2>
            <Link href="/contests" className="text-xs text-scorecaster-green hover:underline font-medium">View Hub</Link>
          </div>
          
          {!myContests || myContests.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
              <p>You haven't joined any contests yet.</p>
              <Link href="/contests" className="text-scorecaster-green text-sm font-medium hover:underline mt-1">Join or Create one</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myContests.map((membership: any) => (
                <Link 
                  key={membership.contest_id} 
                  href={`/contests/${membership.contest_id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-scorecaster-green hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Trophy className="h-8 w-8 text-yellow-400 flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-scorecaster-text truncate">{membership.contests.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Role: {membership.role}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-scorecaster-green" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}