export type ContestSeasonLength = 'full' | 'first_half' | 'second_half'

export const FULL_SEASON_MATCHDAYS = 38
export const HALF_SEASON_MATCHDAYS = 19

export const CONTEST_SEASON_LENGTHS: ContestSeasonLength[] = [
  'full',
  'first_half',
  'second_half',
]

/** Map DB / legacy values (`half`) onto the three current options. */
export function normalizeSeasonLength(
  seasonLength: string | null | undefined
): ContestSeasonLength {
  if (seasonLength === 'half' || seasonLength === 'first_half') return 'first_half'
  if (seasonLength === 'second_half') return 'second_half'
  return 'full'
}

export function isValidSeasonLength(value: string | null | undefined): value is ContestSeasonLength {
  return value === 'full' || value === 'first_half' || value === 'second_half'
}

export function getSeasonMatchdayRange(
  seasonLength: string | null | undefined
): { min: number; max: number } {
  const normalized = normalizeSeasonLength(seasonLength)
  if (normalized === 'first_half') return { min: 1, max: HALF_SEASON_MATCHDAYS }
  if (normalized === 'second_half') {
    return { min: HALF_SEASON_MATCHDAYS + 1, max: FULL_SEASON_MATCHDAYS }
  }
  return { min: 1, max: FULL_SEASON_MATCHDAYS }
}

export function isMatchInContestSeason(
  match: { matchday?: number | null },
  seasonLength: string | null | undefined
): boolean {
  const matchday = Number(match.matchday)
  const { min, max } = getSeasonMatchdayRange(seasonLength)
  return Number.isFinite(matchday) && matchday >= min && matchday <= max
}

/** i18n keys for short labels (hub, ranking, home). */
export function getSeasonLengthLabelKey(
  seasonLength: string | null | undefined
): 'Full season' | 'First half' | 'Second half' {
  const normalized = normalizeSeasonLength(seasonLength)
  if (normalized === 'first_half') return 'First half'
  if (normalized === 'second_half') return 'Second half'
  return 'Full season'
}

/** i18n keys for page descriptions (fixtures header). */
export function getSeasonLengthDescriptionKey(
  seasonLength: string | null | undefined
):
  | 'Full season — all 38 matchdays'
  | 'First half — matchdays 1–19'
  | 'Second half — matchdays 20–38' {
  const normalized = normalizeSeasonLength(seasonLength)
  if (normalized === 'first_half') return 'First half — matchdays 1–19'
  if (normalized === 'second_half') return 'Second half — matchdays 20–38'
  return 'Full season — all 38 matchdays'
}
