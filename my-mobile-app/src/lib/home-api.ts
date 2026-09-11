import { siteUrl, supabase } from '@/lib/supabase';
import { normalizeContestMemberships } from '@/lib/normalize';

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
  source: 'api' | 'supabase';
};

function looksLikeHtml(body: string) {
  const trimmed = body.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function apiBaseUrl() {
  // Prefer www to avoid the apex → www redirect dropping the request shape.
  return siteUrl.replace('://xactscore.app', '://www.xactscore.app');
}

async function fetchHomeFromApi(accessToken: string): Promise<HomeDashboard> {
  const response = await fetch(`${apiBaseUrl()}/api/mobile/home`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();

  if (!response.ok || !contentType.includes('application/json') || looksLikeHtml(body)) {
    throw new Error(
      'Home API is not available on the website yet. Showing your leagues from Supabase instead.'
    );
  }

  const json = JSON.parse(body) as Omit<HomeDashboard, 'source'>;
  return { ...json, source: 'api' };
}

async function fetchHomeFromSupabase(userId: string, email: string | null): Promise<HomeDashboard> {
  const [{ data: profile }, { data: memberRows, error: memberError }] = await Promise.all([
    supabase
      .from('users')
      .select('username, email, avatar_url, favorite_team, is_global_admin')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('contest_members')
      .select(
        `
        contest_id,
        role,
        joined_at,
        contests (
          name,
          contest_key,
          season_length,
          is_open,
          is_public
        )
      `
      )
      .eq('user_id', userId)
      .order('joined_at', { ascending: false }),
  ]);

  if (memberError) {
    throw new Error(memberError.message);
  }

  const memberships = normalizeContestMemberships(memberRows);
  const contestIds = memberships.map((row) => row.contest_id);

  const { data: predictions } = contestIds.length
    ? await supabase
        .from('predictions')
        .select('contest_id, user_id, points, match_id, predicted_home_score')
        .in('contest_id', contestIds)
    : { data: [] };

  const leagues: HomeLeague[] = memberships.map((membership) => {
    const members = new Map<string, number>();
    ;(predictions || [])
      .filter((prediction) => prediction.contest_id === membership.contest_id)
      .forEach((prediction) => {
        members.set(
          prediction.user_id,
          (members.get(prediction.user_id) || 0) + (Number(prediction.points) || 0)
        );
      });
    const sorted = Array.from(members.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([id]) => id === userId) + 1;

    return {
      contestId: membership.contest_id,
      name: membership.contests?.name || 'League',
      openPicks: 0,
      rank: rank || null,
    };
  });

  const bestRank = leagues.reduce<number | null>((best, league) => {
    if (!league.rank) return best;
    return best == null || league.rank < best ? league.rank : best;
  }, null);

  return {
    profile: {
      username: profile?.username ?? null,
      email: profile?.email ?? email,
      avatarUrl: profile?.avatar_url ?? null,
      favoriteTeam: profile?.favorite_team ?? null,
      favoriteCrest: null,
      isGlobalAdmin: profile?.is_global_admin === true,
    },
    leagues,
    bestRank,
    nextMatch: null,
    recentScores: [],
    predictPath: leagues[0] ? `/contests/${leagues[0].contestId}/predictions` : '/contests',
    source: 'supabase',
  };
}

export async function fetchHomeDashboard(): Promise<HomeDashboard> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session.user) {
    throw new Error('Not signed in');
  }

  try {
    return await fetchHomeFromApi(session.access_token);
  } catch {
    return fetchHomeFromSupabase(session.user.id, session.user.email ?? null);
  }
}

export function webPath(path: string) {
  return `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
