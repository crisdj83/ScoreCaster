export const PREDICTION_LOCK_MS = 60 * 60 * 1000
export const PREDICTION_REVEAL_MS = 30 * 60 * 1000

export const DEFAULT_SCORING = {
  exact: 3,
  close: 1.5,
  result: 1,
} as const

export type ContestScoring = {
  exact: number
  close: number
  result: number
}

export type ScoreResult = {
  points: number
  is_exact: boolean
  is_close: boolean
  is_correct: boolean
}

export type MatchOutcome = 'HOME' | 'AWAY' | 'DRAW'

export function resolveContestScoring(contest?: {
  points_exact?: number | null
  points_close?: number | null
  points_result?: number | null
} | null): ContestScoring {
  return {
    exact: Number(contest?.points_exact) || DEFAULT_SCORING.exact,
    close: Number(contest?.points_close) || DEFAULT_SCORING.close,
    result: Number(contest?.points_result) || DEFAULT_SCORING.result,
  }
}

export function matchOutcome(home: number, away: number): MatchOutcome {
  if (home > away) return 'HOME'
  if (home < away) return 'AWAY'
  return 'DRAW'
}

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  scoring: ContestScoring = DEFAULT_SCORING
): ScoreResult {
  const predictedHomeScore = Number(predictedHome)
  const predictedAwayScore = Number(predictedAway)
  const actualHomeScore = Number(actualHome)
  const actualAwayScore = Number(actualAway)

  if (predictedHomeScore === actualHomeScore && predictedAwayScore === actualAwayScore) {
    return {
      points: scoring.exact,
      is_exact: true,
      is_close: false,
      is_correct: true,
    }
  }

  const isCorrect =
    matchOutcome(predictedHomeScore, predictedAwayScore) ===
    matchOutcome(actualHomeScore, actualAwayScore)
  const totalGoalsDiff = Math.abs(
    (actualHomeScore + actualAwayScore) - (predictedHomeScore + predictedAwayScore)
  )
  const isClose = isCorrect && totalGoalsDiff <= 1

  if (isClose) {
    return {
      points: scoring.close,
      is_exact: false,
      is_close: true,
      is_correct: true,
    }
  }

  if (isCorrect) {
    return {
      points: scoring.result,
      is_exact: false,
      is_close: false,
      is_correct: true,
    }
  }

  return {
    points: 0,
    is_exact: false,
    is_close: false,
    is_correct: false,
  }
}

export function isPredictionLocked(utcDate: string, now = Date.now()): boolean {
  const kickoff = new Date(utcDate).getTime()
  return !Number.isFinite(kickoff) || now >= kickoff - PREDICTION_LOCK_MS
}

export function isPredictionRevealable(utcDate: string, now = Date.now()): boolean {
  const kickoff = new Date(utcDate).getTime()
  return Number.isFinite(kickoff) && now >= kickoff - PREDICTION_REVEAL_MS
}

export function getOfficialScore(match: {
  status?: string | null
  score?: {
    fullTime?: { home?: number | null; away?: number | null }
  } | null
}): { home: number; away: number } | null {
  if (!['FINISHED', 'IN_PLAY', 'PAUSED'].includes(match.status || '')) return null
  const home = match.score?.fullTime?.home
  const away = match.score?.fullTime?.away
  if (home === null || home === undefined || away === null || away === undefined) {
    return null
  }
  return { home, away }
}
