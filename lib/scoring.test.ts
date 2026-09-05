import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calculatePoints,
  getOfficialScore,
  isPredictionLocked,
  isPredictionRevealable,
  resolveContestScoring,
} from './scoring.ts'

describe('calculatePoints', () => {
  it('awards exact points for the precise score', () => {
    const result = calculatePoints(2, 1, 2, 1)
    assert.deepEqual(result, {
      points: 3,
      is_exact: true,
      is_close: false,
      is_correct: true,
    })
  })

  it('treats close as correct outcome with total goals off by at most 1', () => {
    const result = calculatePoints(1, 0, 2, 0)
    assert.deepEqual(result, {
      points: 1.5,
      is_exact: false,
      is_close: true,
      is_correct: true,
    })
  })

  it('does not treat same goal difference as close when totals differ by more than 1', () => {
    const result = calculatePoints(2, 1, 3, 2)
    assert.deepEqual(result, {
      points: 1,
      is_exact: false,
      is_close: false,
      is_correct: true,
    })
  })

  it('awards result points for the right outcome that is not close', () => {
    const result = calculatePoints(1, 0, 4, 0)
    assert.equal(result.points, 1)
    assert.equal(result.is_correct, true)
    assert.equal(result.is_close, false)
  })

  it('awards zero for a wrong outcome', () => {
    const result = calculatePoints(0, 1, 2, 0)
    assert.deepEqual(result, {
      points: 0,
      is_exact: false,
      is_close: false,
      is_correct: false,
    })
  })

  it('uses contest-specific point values', () => {
    const scoring = { exact: 5, close: 2, result: 1 }
    assert.equal(calculatePoints(1, 1, 1, 1, scoring).points, 5)
    assert.equal(calculatePoints(1, 0, 2, 0, scoring).points, 2)
    assert.equal(calculatePoints(1, 0, 4, 0, scoring).points, 1)
  })
})

describe('contest helpers', () => {
  it('falls back to default scoring', () => {
    assert.deepEqual(resolveContestScoring(null), { exact: 3, close: 1.5, result: 1 })
  })

  it('locks one hour before kickoff', () => {
    const kickoff = '2026-09-04T18:00:00.000Z'
    const hourBefore = Date.parse(kickoff) - 60 * 60 * 1000
    assert.equal(isPredictionLocked(kickoff, hourBefore - 1), false)
    assert.equal(isPredictionLocked(kickoff, hourBefore), true)
  })

  it('reveals 30 minutes before kickoff', () => {
    const kickoff = '2026-09-04T18:00:00.000Z'
    const halfHourBefore = Date.parse(kickoff) - 30 * 60 * 1000
    assert.equal(isPredictionRevealable(kickoff, halfHourBefore - 1), false)
    assert.equal(isPredictionRevealable(kickoff, halfHourBefore), true)
  })

  it('only grades matches with a full-time score', () => {
    assert.equal(getOfficialScore({ status: 'FINISHED', score: { fullTime: { home: 1, away: 0 } } })?.home, 1)
    assert.equal(getOfficialScore({ status: 'IN_PLAY', score: { fullTime: { home: null, away: null } } }), null)
    assert.equal(getOfficialScore({ status: 'SCHEDULED', score: { fullTime: { home: 0, away: 0 } } }), null)
  })
})
