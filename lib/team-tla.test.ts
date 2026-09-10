import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { teamDisplayName, teamTla } from './team-tla.ts'

describe('teamTla', () => {
  it('prefers the official football-data TLA', () => {
    assert.equal(teamTla({ name: 'Manchester City FC', shortName: 'Man City', tla: 'MCI' }), 'MCI')
    assert.equal(teamTla({ name: 'Manchester United FC', shortName: 'Man United', tla: 'MUN' }), 'MUN')
  })

  it('maps common Premier League names when TLA is missing', () => {
    assert.equal(teamTla({ name: 'Wolverhampton Wanderers FC' }), 'WOL')
    assert.equal(teamTla({ name: 'Tottenham Hotspur FC', shortName: 'Spurs' }), 'TOT')
    assert.equal(teamTla({ name: 'Nottingham Forest FC' }), 'NFO')
  })
})

describe('teamDisplayName', () => {
  it('uses shortName when present', () => {
    assert.equal(teamDisplayName({ name: 'Wolverhampton Wanderers FC', shortName: 'Wolves' }), 'Wolves')
  })
})
