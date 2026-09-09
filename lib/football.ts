import { chunk } from './utils'

const BASE_URL = 'https://api.football-data.org/v4';

async function fetchFootballData(
  path: string,
  revalidateSeconds = 300,
  extraHeaders: Record<string, string> = {}
) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY is not configured');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-Auth-Token': apiKey,
      ...extraHeaders,
    },
    next: { revalidate: revalidateSeconds, tags: ['football-data'] },
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(
      `football-data.org request failed: ${res.status} ${res.statusText}${details ? ` — ${details}` : ''}`
    );
  }

  return res.json();
}

// Function 1: Gets the individual matches (What we just used)
export async function getPLMatches() {
  return fetchFootballData('/competitions/PL/matches', 300, { 'X-Unfold-Goals': 'true' });
}

// Function 2: Gets the Live League Table (New!)
export async function getPLStandings() {
  return fetchFootballData('/competitions/PL/standings', 600);
}

export async function getPLScorers() {
  return fetchFootballData('/competitions/PL/scorers?limit=50', 600);
}

export type FootballGoal = {
  minute?: number
  injuryTime?: number | null
  type?: string
  team?: { id?: number | string; name?: string }
  scorer?: { id?: number | string; name?: string }
}

/** Per-match goals. The season list does not include them; this is a separate call per id. */
export async function getPLMatchGoals(ids: Array<string | number>): Promise<Map<string, FootballGoal[]>> {
  const goalsByMatch = new Map<string, FootballGoal[]>()
  for (const group of chunk(ids, 4)) {
    const rows = await Promise.all(
      group.map(async (id) => {
        try {
          const match = await fetchFootballData(`/matches/${id}`, 86400, { 'X-Unfold-Goals': 'true' })
          return [String(id), Array.isArray(match?.goals) ? (match.goals as FootballGoal[]) : []] as const
        } catch (error) {
          console.error(`football-data.org match ${id} goals failed:`, error)
          return [String(id), [] as FootballGoal[]] as const
        }
      })
    )
    for (const [id, goals] of rows) goalsByMatch.set(id, goals)
  }
  return goalsByMatch
}