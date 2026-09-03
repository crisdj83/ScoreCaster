// The 3-Tier Scoring System
const POINTS_EXACT = 3;    // Exact score (e.g., predicted 2-1, actual 2-1)
const POINTS_CLOSE = 2;    // Correct outcome & correct goal difference (e.g., predicted 2-1, actual 3-2)
const POINTS_CORRECT = 1;  // Correct outcome only (e.g., predicted 2-0, actual 3-0)
const POINTS_WRONG = 0;    // Completely wrong

export function calculatePoints(
  predictedHome: number, 
  predictedAway: number, 
  actualHome: number, 
  actualAway: number
) {
  // 1. Did they get the EXACT score? (3 Points)
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return {
      points: POINTS_EXACT,
      is_exact: true,
      is_close: false,
      is_correct: true
    };
  }

  // Calculate goal differences to check if it was a "Close" prediction
  const actualDiff = actualHome - actualAway;
  const predictedDiff = predictedHome - predictedAway;

  // Figure out the OUTCOME of the real match and the predicted match
  const actualOutcome = actualHome > actualAway ? 'HOME_WIN' 
                      : actualHome < actualAway ? 'AWAY_WIN' 
                      : 'DRAW';

  const predictedOutcome = predictedHome > predictedAway ? 'HOME_WIN' 
                         : predictedHome < predictedAway ? 'AWAY_WIN' 
                         : 'DRAW';

  // 2. Was it CLOSE? (Correct outcome AND exact goal difference) (2 Points)
  if (actualOutcome === predictedOutcome && actualDiff === predictedDiff) {
    return {
      points: POINTS_CLOSE,
      is_exact: false,
      is_close: true,
      is_correct: true
    };
  }

  // 3. Was it just CORRECT? (Correct outcome, wrong goal difference) (1 Point)
  if (actualOutcome === predictedOutcome) {
    return {
      points: POINTS_CORRECT,
      is_exact: false,
      is_close: false,
      is_correct: true
    };
  }

  // 4. Completely wrong (0 Points)
  return {
    points: POINTS_WRONG,
    is_exact: false,
    is_close: false,
    is_correct: false
  };
}