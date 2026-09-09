const API_SPORTS_URL = 'https://v3.football.api-sports.io'
const RAPID_API_URL = 'https://api-football-v1.p.rapidapi.com/v3'
const PL_LEAGUE_ID = 39
const SEASON_REVALIDATE = 60 * 60 * 24
const LIVE_REVALIDATE = 10 * 60
const KICKOFF_SLACK_MS = 12 * 60 * 60 * 1000

type AfVenue = { id?: number | null; name?: string | null; city?: string | null }

type AfEvent = {
  time?: { elapsed?: number | null; extra?: number | null }
  team?: { id?: number; name?: string }
  player?: { id?: number | null; name?: string | null }
  type?: string
  detail?: string
}

type AfFixture = {
  fixture: {
    id: number
    date: string
    venue?: AfVenue | null
    status?: { short?: string; elapsed?: number | null }
  }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  events?: AfEvent[]
}

export type FootballMatchRef = {
  id: number | string
  utcDate: string
  status?: string
  homeTeam: { name: string; shortName?: string }
  awayTeam: { name: string; shortName?: string }
}

export type LiveScorers = {
  home: string[]
  away: string[]
  elapsed?: number | null
}

const NAME_ALIASES: Record<string, string> = {
  spurs: 'tottenham',
  'tottenham hotspur': 'tottenham',
  wolves: 'wolverhampton',
  'wolverhampton wanderers': 'wolverhampton',
  'man city': 'manchester city',
  'manchester city': 'manchester city',
  'man utd': 'manchester united',
  'man united': 'manchester united',
  'manchester united': 'manchester united',
  "nott'm forest": 'nottingham forest',
  'nottingham forest': 'nottingham forest',
  'brighton and hove albion': 'brighton',
  'brighton hove albion': 'brighton',
  'west ham united': 'west ham',
  'newcastle united': 'newcastle',
  'leicester city': 'leicester',
  'leeds united': 'leeds',
  'ipswich town': 'ipswich',
  'sunderland afc': 'sunderland',
  'afc bournemouth': 'bournemouth',
}

function canonicalName(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\b(fc|afc|cfc)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return NAME_ALIASES[cleaned] || cleaned
}

function namesMatch(a?: string, b?: string) {
  if (!a || !b) return false
  const left = canonicalName(a)
  const right = canonicalName(b)
  return left === right || left.includes(right) || right.includes(left)
}

function teamsMatch(
  afHome: string,
  afAway: string,
  match: FootballMatchRef
) {
  const home = [match.homeTeam.name, match.homeTeam.shortName]
  const away = [match.awayTeam.name, match.awayTeam.shortName]
  return home.some((name) => namesMatch(afHome, name)) && away.some((name) => namesMatch(afAway, name))
}

function lastName(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] || name
}

function formatVenue(venue?: AfVenue | null) {
  const name = venue?.name?.trim()
  if (!name) return ''
  const city = venue?.city?.trim()
  if (city && !name.toLowerCase().includes(city.toLowerCase())) return `${name}, ${city}`
  return name
}

function utcDay(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function plSeasonFromMatches(matches: { utcDate: string }[]) {
  const date = matches.map((match) => new Date(match.utcDate)).find((item) => Number.isFinite(item.getTime()))
  if (!date) {
    const now = new Date()
    return now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  }
  const year = date.getUTCFullYear()
  return date.getUTCMonth() >= 7 ? year : year - 1
}

function isLiveStatus(status?: string) {
  return ['IN_PLAY', 'PAUSED'].includes(status || '')
}

function hasErrorPayload(errors: unknown) {
  if (!errors) return false
  if (Array.isArray(errors)) return errors.length > 0
  if (typeof errors === 'object') return Object.keys(errors as object).length > 0
  if (typeof errors === 'string') return errors.trim().length > 0
  return false
}

function isAuthError(errors: unknown) {
  return JSON.stringify(errors || '').toLowerCase().includes('key')
}

async function apiFootballGet(path: string, revalidateSeconds: number): Promise<any | null> {
  const apiKey = process.env.API_FOOTBALL_KEY?.trim()
  if (!apiKey) {
    console.warn('API-Football: API_FOOTBALL_KEY is missing on the server')
    return null
  }

  const attempts = [
    {
      url: `${API_SPORTS_URL}${path}`,
      headers: { 'x-apisports-key': apiKey },
    },
    {
      url: `${RAPID_API_URL}${path}`,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      },
    },
  ]

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        headers: attempt.headers,
        next: { revalidate: revalidateSeconds, tags: ['api-football'] },
      })
      if (!res.ok) {
        console.error(`API-Football request failed: ${res.status} ${path}`)
        continue
      }
      const json = await res.json()
      if (hasErrorPayload(json?.errors)) {
        console.error('API-Football error:', json.errors)
        if (isAuthError(json.errors)) continue
        return null
      }
      return json
    } catch (error) {
      console.error('API-Football request error:', error)
    }
  }
  return null
}

async function getSeasonFixtures(season: number): Promise<AfFixture[]> {
  const primary = await apiFootballGet(`/fixtures?league=${PL_LEAGUE_ID}&season=${season}`, SEASON_REVALIDATE)
  if (primary?.response?.length) return primary.response
  const fallback = await apiFootballGet(`/fixtures?league=${PL_LEAGUE_ID}&season=${season - 1}`, SEASON_REVALIDATE)
  return fallback?.response || []
}

function findAfFixture(fixtures: AfFixture[], match: FootballMatchRef) {
  const kickoff = new Date(match.utcDate).getTime()
  const day = utcDay(match.utcDate)
  const sameDay = fixtures.filter((fixture) => utcDay(fixture.fixture.date) === day)
  const nearby = Number.isFinite(kickoff)
    ? fixtures.filter((fixture) => {
        const at = new Date(fixture.fixture.date).getTime()
        return Number.isFinite(at) && Math.abs(at - kickoff) <= KICKOFF_SLACK_MS
      })
    : sameDay

  return (
    nearby.find((fixture) => teamsMatch(fixture.teams.home.name, fixture.teams.away.name, match)) ||
    sameDay.find((fixture) => teamsMatch(fixture.teams.home.name, fixture.teams.away.name, match)) ||
    null
  )
}

function isGoalEvent(event: AfEvent) {
  if (event.detail === 'Missed Penalty') return false
  return String(event.type || '').toLowerCase() === 'goal'
}

function scorerLines(events: AfEvent[] | undefined, teamName: string) {
  const order: string[] = []
  const byPlayer = new Map<string, { name: string; bits: string[] }>()
  for (const event of events || []) {
    if (!isGoalEvent(event)) continue
    if (!namesMatch(event.team?.name, teamName)) continue
    const minute = Number(event.time?.elapsed) || 0
    const extra = Number(event.time?.extra) || 0
    const clock = extra > 0 ? `${minute}+${extra}'` : `${minute}'`
    const suffix = event.detail === 'Own Goal' ? ' og' : event.detail === 'Penalty' ? ' pen' : ''
    const playerName = lastName(event.player?.name || 'Goal')
    const key = String(event.player?.id ?? event.player?.name ?? clock)
    let entry = byPlayer.get(key)
    if (!entry) {
      entry = { name: playerName, bits: [] }
      byPlayer.set(key, entry)
      order.push(key)
    }
    entry.bits.push(`${clock}${suffix}`)
  }
  return order.map((key) => {
    const entry = byPlayer.get(key)!
    return `${entry.name} ${entry.bits.join(', ')}`
  })
}

async function getFixtureEvents(fixtureId: number, revalidateSeconds: number): Promise<AfEvent[]> {
  const data = await apiFootballGet(`/fixtures/events?fixture=${fixtureId}`, revalidateSeconds)
  return Array.isArray(data?.response) ? data.response : []
}

export async function getMatchVenues(matches: FootballMatchRef[]): Promise<Map<string, string>> {
  const venues = new Map<string, string>()
  if (!matches.length || !process.env.API_FOOTBALL_KEY?.trim()) return venues
  const fixtures = await getSeasonFixtures(plSeasonFromMatches(matches))
  for (const match of matches) {
    const fixture = findAfFixture(fixtures, match)
    const venue = formatVenue(fixture?.fixture.venue)
    if (venue) venues.set(String(match.id), venue)
  }
  return venues
}

export async function getLiveGoalScorers(matches: FootballMatchRef[]): Promise<Map<string, LiveScorers>> {
  const scorers = new Map<string, LiveScorers>()
  if (!matches.length || !process.env.API_FOOTBALL_KEY?.trim()) return scorers
  const fixtures = await getSeasonFixtures(plSeasonFromMatches(matches))
  if (!fixtures.length) {
    console.error('API-Football: no Premier League fixtures returned for the current season')
    return scorers
  }

  const mapped: Array<{ match: FootballMatchRef; fixture: AfFixture }> = []
  for (const match of matches) {
    const fixture = findAfFixture(fixtures, match)
    if (!fixture) continue
    mapped.push({ match, fixture })
  }
  if (!mapped.length) {
    console.error(`API-Football: could not match any of ${matches.length} games to API-Football fixtures`)
    return scorers
  }

  const eventResults = await Promise.all(
    mapped.map(({ match, fixture }) =>
      getFixtureEvents(fixture.fixture.id, isLiveStatus(match.status) ? LIVE_REVALIDATE : SEASON_REVALIDATE)
    )
  )

  mapped.forEach(({ match, fixture }, index) => {
    const events = eventResults[index] || []
    scorers.set(String(match.id), {
      home: scorerLines(events, fixture.teams.home.name),
      away: scorerLines(events, fixture.teams.away.name),
      elapsed: fixture.fixture.status?.elapsed ?? null,
    })
  })
  return scorers
}

export async function warmApiFootballCache() {
  await getSeasonFixtures(plSeasonFromMatches([]))
}
