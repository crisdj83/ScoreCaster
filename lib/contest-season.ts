export type ContestSeasonLength = 'full' | 'half'

export const FULL_SEASON_MATCHDAYS = 38
export const HALF_SEASON_MATCHDAYS = 19

export function getSeasonMatchdayLimit(seasonLength: string | null | undefined): number {
  return seasonLength === 'half' ? HALF_SEASON_MATCHDAYS : FULL_SEASON_MATCHDAYS
}

export function isMatchInContestSeason(
  match: { matchday?: number | null },
  seasonLength: string | null | undefined
): boolean {
  const matchday = Number(match.matchday)
  return Number.isFinite(matchday) && matchday >= 1 && matchday <= getSeasonMatchdayLimit(seasonLength)
}
