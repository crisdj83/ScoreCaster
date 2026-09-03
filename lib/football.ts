const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

// Function 1: Gets the individual matches (What we just used)
export async function getPLMatches() {
  const res = await fetch(`${BASE_URL}/competitions/PL/matches`, {
    headers: {
      'X-Auth-Token': API_KEY!,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch matches from football-data.org');
  }

  return res.json();
}

// Function 2: Gets the Live League Table (New!)
export async function getPLStandings() {
  const res = await fetch(`${BASE_URL}/competitions/PL/standings`, {
    headers: {
      'X-Auth-Token': API_KEY!,
    },
    // Cache for 1 hour
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch standings from football-data.org');
  }

  return res.json();
}