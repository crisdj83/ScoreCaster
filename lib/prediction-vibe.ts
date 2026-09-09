export type PredictionOutcomeKind = 'exact' | 'close' | 'result' | 'zero'

export type PredictionVibe = {
  tone: 'praise' | 'mixed' | 'roast' | 'empty'
  emoji: string
  /** English source string — pass through t() for ro/es */
  message: string
}

/**
 * Roast or praise a player from their most recent scored prediction outcomes
 * (newest last). Expect 0–3 items.
 */
export function vibeFromOutcomes(outcomes: PredictionOutcomeKind[]): PredictionVibe {
  if (outcomes.length === 0) {
    return {
      tone: 'empty',
      emoji: '😴🔮',
      message: 'Still warming up the crystal ball… no scored picks yet. 😴🔮',
    }
  }

  const exact = outcomes.filter((o) => o === 'exact').length
  const close = outcomes.filter((o) => o === 'close').length
  const result = outcomes.filter((o) => o === 'result').length
  const zero = outcomes.filter((o) => o === 'zero').length
  const n = outcomes.length

  if (exact === n && n >= 3) {
    return {
      tone: 'praise',
      emoji: '🎯🔥😎',
      message: 'Three perfect hits in a row! Call the fire brigade — this sniper is cooking! 🎯🔥😎',
    }
  }
  if (exact === n && n === 2) {
    return {
      tone: 'praise',
      emoji: '🎯✨',
      message: 'Back-to-back exact scores. Someone checked the future. 🎯✨🐐',
    }
  }
  if (exact === n) {
    return {
      tone: 'praise',
      emoji: '🎯',
      message: 'Nailed the last pick exactly. Big main-character energy. 🎯😎',
    }
  }
  if (exact >= 2) {
    return {
      tone: 'praise',
      emoji: '🐐💥',
      message: 'Two exact scores in the last three. Absolute menace to the table. 🐐💥',
    }
  }
  if (zero === n && n >= 3) {
    return {
      tone: 'roast',
      emoji: '🙈📉',
      message: 'Three straight blanks. Did they predict with their eyes closed? 🙈📉💔',
    }
  }
  if (zero === n) {
    return {
      tone: 'roast',
      emoji: '🫠',
      message: 'Recent form: pure vibes, zero points. The football gods declined the call. 🫠📵',
    }
  }
  if (zero >= 2) {
    return {
      tone: 'roast',
      emoji: '🤡⚽',
      message: 'Mostly whiffs lately. Bold strategy — let’s see if it pays off. 🤡⚽📉',
    }
  }
  if (exact + close === n) {
    return {
      tone: 'praise',
      emoji: '✨👏',
      message: 'Hitting or nearly hitting every time. Elite vibes only. ✨👏🎯',
    }
  }
  if (zero === 0 && exact + close + result === n) {
    return {
      tone: 'praise',
      emoji: '💪🔥',
      message: 'No zeros in the last stretch — solid form, keep cooking! 💪🔥',
    }
  }
  if (exact > 0 && zero > 0) {
    return {
      tone: 'mixed',
      emoji: '🎢😵',
      message: 'One minute a prophet, the next a tourist. Rollercoaster form! 🎢😵🎯',
    }
  }
  if (close + result >= 2 && exact === 0) {
    return {
      tone: 'mixed',
      emoji: '🤏😅',
      message: 'Getting the gist but missing the fireworks. So close… yet so mid. 🤏😅',
    }
  }
  return {
    tone: 'mixed',
    emoji: '🎲😂',
    message: 'Mixed bag lately — chaos merchant energy. Respect the unpredictability. 🎲😂',
  }
}

export function outcomeKindFromPoints(
  points: number | null,
  scoring: { exact: number; close: number; result: number }
): PredictionOutcomeKind | null {
  if (points === null) return null
  if (points === scoring.exact) return 'exact'
  if (points === scoring.close) return 'close'
  if (points === scoring.result) return 'result'
  return points > 0 ? 'result' : 'zero'
}
