import { siteUrl, supabase } from '@/lib/supabase';

export type HomeLeague = {
  contestId: string;
  name: string;
  openPicks: number;
  rank: number | null;
};

export type HomeScore = {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

export type HomeNextMatch = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  venue?: string | null;
};

export type HomeDashboard = {
  profile: {
    username: string | null;
    email: string | null;
    avatarUrl: string | null;
    favoriteTeam: string | null;
    favoriteCrest: string | null;
    isGlobalAdmin: boolean;
  };
  leagues: HomeLeague[];
  bestRank: number | null;
  nextMatch: HomeNextMatch | null;
  recentScores: HomeScore[];
  predictPath: string;
};

export async function fetchHomeDashboard(): Promise<HomeDashboard> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${siteUrl}/api/mobile/home`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Home request failed (${response.status})`);
  }

  return (await response.json()) as HomeDashboard;
}

export function webPath(path: string) {
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
