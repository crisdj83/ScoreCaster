const BASE_URL = 'https://api.football-data.org/v4';

async function fetchFootballData(path: string, revalidateSeconds = 300) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY is not configured');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-Auth-Token': apiKey,
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
  return fetchFootballData('/competitions/PL/matches');
}

// Function 2: Gets the Live League Table (New!)
export async function getPLStandings() {
  return fetchFootballData('/competitions/PL/standings', 600);
}

export async function getPLScorers() {
  return fetchFootballData('/competitions/PL/scorers?limit=50', 600);
}