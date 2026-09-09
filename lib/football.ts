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

/** Per-match goals. The season list omits them. Sequential to stay under football-data.org's 10 req/min. */
export async function getPLMatchGoals(ids: Array<string | number>): Promise<Map<string, FootballGoal[]>> {
  const goalsByMatch = new Map<string, FootballGoal[]>()
  for (const id of ids.slice(0, 3)) {
    try {
      const match = await fetchFootballData(`/matches/${id}`, 3600, { 'X-Unfold-Goals': 'true' })
      goalsByMatch.set(String(id), Array.isArray(match?.goals) ? (match.goals as FootballGoal[]) : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('429')) {
        console.warn('football-data.org rate limit; skipping remaining goal fetches')
        break
      }
      console.error(`football-data.org match ${id} goals failed:`, message)
    }
  }
  return goalsByMatch
}