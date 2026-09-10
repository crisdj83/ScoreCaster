const DEFAULT_BASE_URL = 'https://api.goal-api.com/v1'
/** England Premier League — Goal API coverage id (apiId 152). */
const PL_LEAGUE_ID = 'cmr77dvkr005nrx06lp7rvp49'
const SEASON_REVALIDATE = 60 * 60 * 6
const LIVE_REVALIDATE = 120
const EVENTS_LIVE_REVALIDATE = 180
const EVENTS_FINISHED_REVALIDATE = 60 * 60 * 24
const TOP_SCORERS_REVALIDATE = 60 * 60 * 6
const MATCH_SLACK_MS = 36 * 60 * 60 * 1000
const MAX_EVENT_FETCHES = 6
const QUOTA_RESERVE = 40

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

export type LeagueTopScorer = {
  player: { id?: string | number; name: string }
  team?: { name?: string; crest?: string }
  name?: string
  goals?: number
  assists?: number
}

type GoalEnvelope = {
  success?: boolean
  data?: unknown
  pagination?: { total?: number; limit?: number; offset?: number; hasMore?: boolean }
  error?: string
  message?: string
  code?: string
}

type GoalFixture = {
  id?: string | number
  apiId?: string | number
  date?: string
  utcDate?: string
  kickoff?: string
  datetime?: string
  match_date?: string
  match_time?: string
  status?: string
  minute?: number | string | null
  elapsed?: number | null
  homeScore?: number | null
  awayScore?: number | null
  venue?: unknown
  stadium?: unknown
  venueName?: string
  location?: string
  match_stadium?: string
  homeTeam?: { id?: string | number; name?: string; shortName?: string }
  awayTeam?: { id?: string | number; name?: string; shortName?: string }
  match_hometeam_name?: string
  match_awayteam_name?: string
  events?: unknown
  goalscorer?: unknown
  goals?: unknown
}

type GoalEvent = {
  type?: string
  detail?: string
  time?: unknown
  elapsed?: number | null
  extra?: number | null
  minute?: number | string | null
  team?: { id?: string | number; name?: string }
  player?: { id?: string | number; name?: string }
  teamName?: string
  playerName?: string
  home_scorer?: string
  away_scorer?: string
  score?: string
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

let lastRemaining: number | null = null

function apiKey() {
  return process.env.GOAL_API_KEY?.trim() || ''
}

function leagueId() {
  return process.env.GOAL_API_PL_LEAGUE_ID?.trim() || PL_LEAGUE_ID
}

function apiBaseUrl() {
  const raw = process.env.GOAL_API_URL?.trim() || DEFAULT_BASE_URL
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/+$/, '')
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  const rec = asRecord(value)
  if (!rec) return []
  for (const key of ['data', 'events', 'goalscorer', 'goals', 'items', 'fixtures']) {
    if (Array.isArray(rec[key])) return rec[key] as T[]
  }
  return []
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

function teamsMatch(homeName: string, awayName: string, match: FootballMatchRef) {
  const home = [match.homeTeam.name, match.homeTeam.shortName]
  const away = [match.awayTeam.name, match.awayTeam.shortName]
  return home.some((name) => namesMatch(homeName, name)) && away.some((name) => namesMatch(awayName, name))
}

function lastName(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] || name
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  const rec = asRecord(value)
  if (!rec) return ''
  return text(rec.name || rec.shortName || rec.city)
}

function fixtureHomeName(fixture: GoalFixture) {
  return text(fixture.homeTeam?.name) || text(fixture.match_hometeam_name)
}

function fixtureAwayName(fixture: GoalFixture) {
  return text(fixture.awayTeam?.name) || text(fixture.match_awayteam_name)
}

function formatVenue(fixture: GoalFixture) {
  const venueRec = asRecord(fixture.venue)
  const stadiumRec = asRecord(fixture.stadium)
  const name =
    text(venueRec?.name) ||
    text(stadiumRec?.name) ||
    text(fixture.venueName) ||
    text(fixture.match_stadium) ||
    text(fixture.venue) ||
    text(fixture.stadium) ||
    text(fixture.location)
  if (!name) return ''
  const city = text(venueRec?.city) || text(stadiumRec?.city)
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

function fixtureKickoff(fixture: GoalFixture) {
  const direct = fixture.utcDate || fixture.date || fixture.kickoff || fixture.datetime
  if (direct) {
    const time = new Date(direct).getTime()
    if (Number.isFinite(time)) return time
  }
  if (fixture.match_date) {
    const stamp = `${fixture.match_date}T${fixture.match_time || '00:00'}:00Z`
    const time = new Date(stamp).getTime()
    if (Number.isFinite(time)) return time
  }
  return NaN
}

function utcDay(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function plSeasonWindow() {
  const now = new Date()
  const year = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  return { from: `${year}-08-01`, to: `${year + 1}-07-31` }
}

function isLiveStatus(status?: string) {
  return ['IN_PLAY', 'PAUSED', 'LIVE', 'HALF_TIME'].includes(status || '')
}

function parseElapsed(fixture: GoalFixture, events: GoalEvent[]) {
  const minute = Number(fixture.minute ?? fixture.elapsed)
  if (Number.isFinite(minute) && minute > 0) return minute
  const minutes = events.map((event) => Number(parseEventClock(event).elapsed) || 0)
  return minutes.length ? Math.max(...minutes) : null
}

function parseEventClock(event: GoalEvent) {
  const timeRec = asRecord(event.time)
  const raw = event.minute ?? event.elapsed ?? timeRec?.elapsed ?? timeRec?.minute ?? event.time
  const extra = Number(event.extra ?? timeRec?.extra ?? timeRec?.injuryTime)
  if (typeof raw === 'string' && raw.includes('+')) {
    const [base, plus] = raw.split('+')
    return { elapsed: Number.parseInt(base, 10) || 0, extra: Number.parseInt(plus, 10) || 0 }
  }
  const elapsed = Number(raw)
  return {
    elapsed: Number.isFinite(elapsed) ? elapsed : 0,
    extra: Number.isFinite(extra) && extra > 0 ? extra : 0,
  }
}

function isGoalEvent(event: GoalEvent) {
  const detail = String(event.detail || '')
  if (/missed penalty/i.test(detail)) return false
  const type = String(event.type || '').toLowerCase()
  if (type === 'goal' || type === 'goals') return true
  if (event.home_scorer || event.away_scorer) return true
  return /\b(normal goal|own goal|penalty)\b/i.test(detail) || /(^|[^a-z])goal([^a-z]|$)/i.test(detail)
}

function clockLabel(elapsed: number, extra: number) {
  return extra > 0 ? `${elapsed}+${extra}'` : `${elapsed}'`
}

function eventSuffix(event: GoalEvent) {
  const blob = `${event.detail || ''} ${event.type || ''}`
  if (/own goal/i.test(blob)) return ' og'
  if (/penalt/i.test(blob)) return ' pen'
  return ''
}

function pushScorer(
  order: string[],
  byPlayer: Map<string, { name: string; bits: string[] }>,
  name: string,
  key: string,
  bit: string
) {
  const player = lastName(name || 'Goal')
  let entry = byPlayer.get(key)
  if (!entry) {
    entry = { name: player, bits: [] }
    byPlayer.set(key, entry)
    order.push(key)
  }
  entry.bits.push(bit)
}

function scorerLinesFromEvents(events: GoalEvent[], side: 'home' | 'away', teamName: string) {
  const order: string[] = []
  const byPlayer = new Map<string, { name: string; bits: string[] }>()
  for (const event of events) {
    if (!isGoalEvent(event)) continue
    const { elapsed, extra } = parseEventClock(event)
    const clock = clockLabel(elapsed, extra)
    const suffix = eventSuffix(event)
    if (event.home_scorer || event.away_scorer) {
      const name = side === 'home' ? event.home_scorer : event.away_scorer
      if (!name) continue
      pushScorer(order, byPlayer, name, name, `${clock}${suffix}`)
      continue
    }
    const eventTeam = text(event.team?.name) || text(event.teamName)
    if (eventTeam && !namesMatch(eventTeam, teamName)) continue
    if (!eventTeam) continue
    const playerName = text(event.player?.name) || text(event.playerName) || 'Goal'
    const key = String(event.player?.id ?? playerName)
    pushScorer(order, byPlayer, playerName, key, `${clock}${suffix}`)
  }
  return order.map((key) => {
    const entry = byPlayer.get(key)!
    return `${entry.name} ${entry.bits.join(', ')}`
  })
}

function eventsFromFixture(fixture: GoalFixture): GoalEvent[] {
  const nested = asList<GoalEvent>(fixture.events)
  if (nested.length) return nested
  const scorers = asList<GoalEvent>(fixture.goalscorer)
  if (scorers.length) return scorers
  return asList<GoalEvent>(fixture.goals)
}

function findGoalFixture(fixtures: GoalFixture[], match: FootballMatchRef) {
  const kickoff = new Date(match.utcDate).getTime()
  const teamHits = fixtures.filter((fixture) => teamsMatch(fixtureHomeName(fixture), fixtureAwayName(fixture), match))
  if (!teamHits.length) return null
  if (Number.isFinite(kickoff)) {
    const closest = [...teamHits]
      .map((fixture) => ({ fixture, dist: Math.abs(fixtureKickoff(fixture) - kickoff) }))
      .sort((a, b) => a.dist - b.dist)[0]
    if (closest && Number.isFinite(closest.dist) && closest.dist <= MATCH_SLACK_MS) {
      return closest.fixture
    }
  }
  const day = utcDay(match.utcDate)
  return (
    teamHits.find((fixture) => {
      const kick = fixtureKickoff(fixture)
      return Number.isFinite(kick) && utcDay(new Date(kick).toISOString()) === day
    }) || teamHits[0]
  )
}

async function goalGet(
  path: string,
  revalidateSeconds: number
): Promise<GoalEnvelope | null> {
  const key = apiKey()
  if (!key) {
    console.warn('GOAL API: GOAL_API_KEY is missing on the server')
    return null
  }

  const url = `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: revalidateSeconds, tags: ['goal-api'] },
      signal: AbortSignal.timeout(6000),
    })
    const remaining = Number(res.headers.get('x-ratelimit-remaining'))
    if (Number.isFinite(remaining)) {
      lastRemaining = remaining
      if (remaining <= QUOTA_RESERVE) {
        console.warn(`GOAL API quota low: ${remaining} remaining (${res.headers.get('x-ratelimit-type') || 'DAILY'})`)
      }
    }
    const json = (await res.json()) as GoalEnvelope
    if (!res.ok) {
      if (res.status === 429) {
        console.warn('GOAL API rate limit; backing off')
        lastRemaining = 0
      } else {
        console.error(`GOAL API ${res.status} ${path}: ${json.message || json.error || json.code || res.statusText}`)
      }
      return null
    }
    if (json.success === false) {
      console.error(`GOAL API error ${path}: ${json.message || json.error || json.code}`)
      return null
    }
    return json
  } catch (error) {
    console.error('GOAL API request error:', error)
    return null
  }
}

function quotaOk() {
  return lastRemaining == null || lastRemaining > QUOTA_RESERVE
}

async function getSeasonFixtures(): Promise<GoalFixture[]> {
  const { from, to } = plSeasonWindow()
  const rows: GoalFixture[] = []
  let offset = 0
  for (let page = 0; page < 5; page += 1) {
    const json = await goalGet(
      `/leagues/${leagueId()}/fixtures?from=${from}&to=${to}&limit=100&offset=${offset}`,
      SEASON_REVALIDATE
    )
    const chunk = asList<GoalFixture>(json?.data)
    rows.push(...chunk)
    const hasMore = json?.pagination?.hasMore ?? chunk.length === 100
    if (!hasMore) break
    offset += 100
  }
  return rows
}

async function getLiveFixtures(): Promise<GoalFixture[]> {
  const json = await goalGet(`/fixtures/live?leagueId=${leagueId()}`, LIVE_REVALIDATE)
  return asList<GoalFixture>(json?.data)
}

async function getFixtureEvents(fixtureId: string, live: boolean): Promise<GoalEvent[]> {
  const json = await goalGet(
    `/fixtures/${encodeURIComponent(fixtureId)}/events`,
    live ? EVENTS_LIVE_REVALIDATE : EVENTS_FINISHED_REVALIDATE
  )
  return asList<GoalEvent>(json?.data)
}

function fixtureId(fixture: GoalFixture) {
  const id = fixture.id ?? fixture.apiId
  return id == null ? '' : String(id)
}

function scorersFor(fixture: GoalFixture, events: GoalEvent[]): LiveScorers {
  const homeName = fixtureHomeName(fixture)
  const awayName = fixtureAwayName(fixture)
  return {
    home: scorerLinesFromEvents(events, 'home', homeName),
    away: scorerLinesFromEvents(events, 'away', awayName),
    elapsed: parseElapsed(fixture, events),
  }
}

export async function getMatchVenues(matches: FootballMatchRef[]): Promise<Map<string, string>> {
  const venues = new Map<string, string>()
  if (!matches.length) return venues

  const unresolved: FootballMatchRef[] = []
  for (const match of matches) {
    const known = homeVenue(match.homeTeam)
    if (known) venues.set(String(match.id), known)
    else unresolved.push(match)
  }
  if (!unresolved.length || !apiKey()) return venues

  const fixtures = await getSeasonFixtures()
  for (const match of unresolved) {
    const fixture = fixtures.length ? findGoalFixture(fixtures, match) : null
    const venue = (fixture ? formatVenue(fixture) : '') || homeVenue(match.homeTeam)
    if (venue) venues.set(String(match.id), venue)
  }
  return venues
}

export async function getLiveGoalScorers(matches: FootballMatchRef[]): Promise<Map<string, LiveScorers>> {
  const scorers = new Map<string, LiveScorers>()
  if (!matches.length || !apiKey()) return scorers

  const [season, live] = await Promise.all([
    getSeasonFixtures(),
    matches.some((match) => isLiveStatus(match.status)) ? getLiveFixtures() : Promise.resolve([] as GoalFixture[]),
  ])
  if (!season.length && !live.length) {
    console.warn('GOAL API: no Premier League fixtures returned')
    return scorers
  }

  const mapped: Array<{ match: FootballMatchRef; fixture: GoalFixture; live: boolean }> = []
  for (const match of matches) {
    const liveHit = live.length ? findGoalFixture(live, match) : null
    const fixture = liveHit || findGoalFixture(season, match)
    if (!fixture) continue
    mapped.push({ match, fixture, live: isLiveStatus(match.status) })
  }
  if (!mapped.length) {
    console.error(`GOAL API: could not match any of ${matches.length} games to Goal fixtures`)
    return scorers
  }

  const pending: typeof mapped = []
  for (const item of mapped) {
    const events = eventsFromFixture(item.fixture)
    const parsed = scorersFor(item.fixture, events)
    if (parsed.home.length || parsed.away.length || (!item.live && events.length > 0)) {
      scorers.set(String(item.match.id), parsed)
    } else {
      pending.push(item)
    }
  }

  let fetched = 0
  for (const item of pending) {
    if (fetched >= MAX_EVENT_FETCHES || !quotaOk()) break
    const id = fixtureId(item.fixture)
    if (!id) continue
    fetched += 1
    const events = await getFixtureEvents(id, item.live)
    scorers.set(String(item.match.id), scorersFor(item.fixture, events))
  }

  return scorers
}

export async function getPlTopScorers(): Promise<{ scorers: LeagueTopScorer[] }> {
  if (!apiKey()) return { scorers: [] }
  const json = await goalGet(`/leagues/${leagueId()}/top-scorers?limit=50`, TOP_SCORERS_REVALIDATE)
  const rows = asList<Record<string, unknown>>(json?.data)
  const scorers = rows.map((row) => {
    const playerRec = asRecord(row.player)
    const teamRec = asRecord(row.team)
    const name = text(playerRec?.name) || text(row.name) || text(row.playerName)
    return {
      player: { id: (playerRec?.id as string | number) || undefined, name },
      team: teamRec
        ? {
            name: text(teamRec.name),
            crest: text(teamRec.logo || teamRec.crest || teamRec.badge),
          }
        : undefined,
      name,
      goals: Number(row.goals ?? row.goal ?? playerRec?.goals) || 0,
      assists: Number(row.assists ?? playerRec?.assists) || 0,
    } satisfies LeagueTopScorer
  })
  return { scorers }
}

export async function warmGoalApiCache() {
  if (!apiKey()) return
  await Promise.all([getSeasonFixtures(), getPlTopScorers()])
}
