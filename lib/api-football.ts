import { chunk } from './utils'

const DEFAULT_API_SPORTS_URL = 'https://v3.football.api-sports.io'
const PL_LEAGUE_ID = 39
const SEASON_REVALIDATE = 60 * 60 * 24
const LIVE_REVALIDATE = 10 * 60
const MATCH_SLACK_MS = 36 * 60 * 60 * 1000

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
  'brighton hove': 'brighton',
  'coventry city': 'coventry',
  'hull city': 'hull',
  nottingham: 'nottingham forest',
}

const HOME_VENUES: Record<string, string> = {
  arsenal: 'Emirates Stadium, London',
  'aston villa': 'Villa Park, Birmingham',
  bournemouth: 'Vitality Stadium, Bournemouth',
  brentford: 'Gtech Community Stadium, Brentford',
  brighton: 'American Express Stadium, Brighton',
  chelsea: 'Stamford Bridge, London',
  coventry: 'Coventry Building Society Arena, Coventry',
  'crystal palace': 'Selhurst Park, London',
  everton: 'Hill Dickinson Stadium, Liverpool',
  fulham: 'Craven Cottage, London',
  hull: 'MKM Stadium, Hull',
  ipswich: 'Portman Road, Ipswich',
  leeds: 'Elland Road, Leeds',
  liverpool: 'Anfield, Liverpool',
  'manchester city': 'Etihad Stadium, Manchester',
  'manchester united': 'Old Trafford, Manchester',
  newcastle: "St James' Park, Newcastle",
  'nottingham forest': 'The City Ground, Nottingham',
  sunderland: 'Stadium of Light, Sunderland',
  tottenham: 'Tottenham Hotspur Stadium, London',
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

function homeVenue(team: FootballMatchRef['homeTeam']) {
  for (const name of [team.name, team.shortName]) {
    if (!name) continue
    const venue = HOME_VENUES[canonicalName(name)]
    if (venue) return venue
  }
  return ''
}

function apiBaseUrl() {
  const raw = process.env.API_FOOTBALL_URL?.trim() || DEFAULT_API_SPORTS_URL
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/+$/, '')
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

type ApiFootballPayload = {
  errors?: unknown
  response?: unknown
}

async function apiFootballGet(
  path: string,
  revalidateSeconds: number,
  cache: 'revalidate' | 'no-store' = 'revalidate'
): Promise<ApiFootballPayload | null> {
  const apiKey = process.env.API_FOOTBALL_KEY?.trim()
  if (!apiKey) {
    console.warn('API-Football: API_FOOTBALL_KEY is missing on the server')
    return null
  }

  const url = `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  try {
    const res = await fetch(url, {
      headers: { 'x-apisports-key': apiKey },
      ...(cache === 'no-store'
        ? { cache: 'no-store' as const }
        : { next: { revalidate: revalidateSeconds, tags: ['api-football'] } }),
    })
    if (!res.ok) {
      console.error(`API-Football request failed: ${res.status} ${path}`)
      return null
    }
    const json = (await res.json()) as ApiFootballPayload
    if (hasErrorPayload(json?.errors)) {
      console.error('API-Football error:', json.errors)
      return null
    }
    return json
  } catch (error) {
    console.error('API-Football request error:', error)
    return null
  }
}

function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

async function getSeasonFixtures(season: number): Promise<AfFixture[]> {
  const path = `/fixtures?league=${PL_LEAGUE_ID}&season=${season}&timezone=UTC`
  const primary = await apiFootballGet(path, SEASON_REVALIDATE)
  const primaryList = asList<AfFixture>(primary?.response)
  if (primaryList.length) return primaryList
  const fallback = await apiFootballGet(
    `/fixtures?league=${PL_LEAGUE_ID}&season=${season - 1}&timezone=UTC`,
    SEASON_REVALIDATE
  )
  return asList<AfFixture>(fallback?.response)
}

async function getFixturesByIds(ids: number[], revalidateSeconds: number): Promise<AfFixture[]> {
  const unique = Array.from(new Set(ids.filter((id) => Number.isFinite(id))))
  const fixtures: AfFixture[] = []
  for (const group of chunk(unique, 20)) {
    const data = await apiFootballGet(`/fixtures?ids=${group.join('-')}&timezone=UTC`, revalidateSeconds, 'no-store')
    fixtures.push(...asList<AfFixture>(data?.response))
  }
  return fixtures
}

function findAfFixture(fixtures: AfFixture[], match: FootballMatchRef) {
  const kickoff = new Date(match.utcDate).getTime()
  const teamHits = fixtures.filter((fixture) =>
    teamsMatch(fixture.teams.home.name, fixture.teams.away.name, match)
  )
  if (!teamHits.length) return null
  if (Number.isFinite(kickoff)) {
    const closest = [...teamHits]
      .map((fixture) => ({
        fixture,
        dist: Math.abs(new Date(fixture.fixture.date).getTime() - kickoff),
      }))
      .sort((a, b) => a.dist - b.dist)[0]
    if (closest && Number.isFinite(closest.dist) && closest.dist <= MATCH_SLACK_MS) {
      return closest.fixture
    }
  }
  const day = utcDay(match.utcDate)
  return teamHits.find((fixture) => utcDay(fixture.fixture.date) === day) || teamHits[0]
}

function isGoalEvent(event: AfEvent) {
  const detail = String(event.detail || '')
  if (/missed penalty/i.test(detail)) return false
  const type = String(event.type || '').toLowerCase()
  if (type === 'goal') return true
  return /\b(normal goal|own goal|penalty)\b/i.test(detail) || /(^|[^a-z])goal([^a-z]|$)/i.test(detail)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function normalizeEvent(raw: unknown): AfEvent | null {
  const rec = asRecord(raw)
  if (!rec) return null
  const timeRec = asRecord(rec.time)
  const teamRec = asRecord(rec.team)
  const playerRec = asRecord(rec.player)
  const elapsed = Number(timeRec?.elapsed ?? rec.elapsed)
  const extra = Number(timeRec?.extra ?? rec.elapsed_plus)
  const teamId = Number(teamRec?.id ?? rec.team_id)
  const playerId = Number(playerRec?.id ?? rec.player_id)
  const teamName = String(teamRec?.name || rec.teamName || rec.team_name || '')
  const playerName = String(
    playerRec?.name || (typeof rec.player === 'string' ? rec.player : '') || ''
  )
  return {
    time: {
      elapsed: Number.isFinite(elapsed) ? elapsed : null,
      extra: Number.isFinite(extra) && extra > 0 ? extra : null,
    },
    team: {
      id: Number.isFinite(teamId) ? teamId : undefined,
      name: teamName,
    },
    player: {
      id: Number.isFinite(playerId) ? playerId : undefined,
      name: playerName,
    },
    type: String(rec.type || ''),
    detail: String(rec.detail || ''),
  }
}

function scorerLines(
  events: AfEvent[] | undefined,
  team: { id?: number; name: string }
) {
  const order: string[] = []
  const byPlayer = new Map<string, { name: string; bits: string[] }>()
  for (const event of events || []) {
    if (!isGoalEvent(event)) continue
    const eventTeamId = event.team?.id
    const sameTeam =
      team.id != null && eventTeamId != null
        ? Number(team.id) === Number(eventTeamId)
        : namesMatch(event.team?.name, team.name)
    if (!sameTeam) continue
    const minute = Number(event.time?.elapsed) || 0
    const extra = Number(event.time?.extra) || 0
    const clock = extra > 0 ? `${minute}+${extra}'` : `${minute}'`
    const suffix = /own goal/i.test(event.detail || '')
      ? ' og'
      : /penalty/i.test(event.detail || '')
        ? ' pen'
        : ''
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
  const data = await apiFootballGet(`/fixtures/events?fixture=${fixtureId}`, revalidateSeconds, 'no-store')
  return asList<unknown>(data?.response).map(normalizeEvent).filter((event): event is AfEvent => !!event)
}

export async function getMatchVenues(matches: FootballMatchRef[]): Promise<Map<string, string>> {
  const venues = new Map<string, string>()
  if (!matches.length) return venues
  const fixtures = process.env.API_FOOTBALL_KEY?.trim()
    ? await getSeasonFixtures(plSeasonFromMatches(matches))
    : []
  for (const match of matches) {
    const fixture = fixtures.length ? findAfFixture(fixtures, match) : null
    const venue = formatVenue(fixture?.fixture.venue) || homeVenue(match.homeTeam)
    if (venue) venues.set(String(match.id), venue)
  }
  return venues
}

function elapsedFrom(fixture: AfFixture, events: AfEvent[]) {
  const statusElapsed = fixture.fixture.status?.elapsed
  if (typeof statusElapsed === 'number') return statusElapsed
  const minutes = events.map((event) => Number(event.time?.elapsed) || 0)
  return minutes.length ? Math.max(...minutes) : null
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

  const revalidate = matches.some((match) => isLiveStatus(match.status)) ? LIVE_REVALIDATE : SEASON_REVALIDATE
  const detailed = await getFixturesByIds(
    mapped.map(({ fixture }) => fixture.fixture.id),
    revalidate
  )
  const byId = new Map(detailed.map((fixture) => [fixture.fixture.id, fixture]))
  const missing = mapped.filter(({ fixture }) => {
    const events = asList<unknown>(byId.get(fixture.fixture.id)?.events).map(normalizeEvent)
    return !events.some((event) => event && isGoalEvent(event))
  })
  // Free plan allows 10 requests/minute. Season fixtures are cached, ids is 1 call.
  // Never fan-out all remaining fixtures in parallel or we 429 and cache empty scorers.
  const extraById = new Map<number, AfEvent[]>()
  for (const { fixture } of missing.slice(0, 6)) {
    extraById.set(fixture.fixture.id, await getFixtureEvents(fixture.fixture.id, revalidate))
  }

  for (const { match, fixture } of mapped) {
    const rich = byId.get(fixture.fixture.id) || fixture
    const fromIds = asList<unknown>(rich.events).map(normalizeEvent).filter((event): event is AfEvent => !!event)
    const events = fromIds.some(isGoalEvent) ? fromIds : extraById.get(fixture.fixture.id) || []
    const home = scorerLines(events, rich.teams.home)
    const away = scorerLines(events, rich.teams.away)
    if (!home.length && !away.length && events.length) {
      console.warn(
        `API-Football: ${events.length} events for ${match.homeTeam.name} vs ${match.awayTeam.name} but no parsed scorers`
      )
    }
    scorers.set(String(match.id), {
      home,
      away,
      elapsed: elapsedFrom(rich, events),
    })
  }
  return scorers
}

export async function warmApiFootballCache() {
  await getSeasonFixtures(plSeasonFromMatches([]))
}
