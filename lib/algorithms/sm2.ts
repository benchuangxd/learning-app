/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * Based on the SuperMemo SM-2 algorithm for optimal review scheduling.
 * 
 * @see https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface SM2Result {
  /** Ease factor (difficulty multiplier) */
  easeFactor: number;
  /** Interval in days until next review */
  interval: number;
  /** Number of consecutive correct answers */
  repetitions: number;
  /** Date of next scheduled review */
  nextReviewDate: Date;
}

export interface SM2Input {
  /** Current ease factor (default: 2.5) */
  easeFactor: number;
  /** Current interval in days (default: 0) */
  interval: number;
  /** Number of consecutive correct answers (default: 0) */
  repetitions: number;
  /** Quality of answer (0-5, where 0=complete blackout, 5=perfect response) */
  quality: number;
}

/**
 * Calculate next review schedule using SM-2 algorithm
 * 
 * Quality ratings:
 * - 5: Perfect response
 * - 4: Correct response after hesitation
 * - 3: Correct response with serious difficulty
 * - 2: Incorrect response; correct answer seemed easy to recall
 * - 1: Incorrect response; correct answer remembered
 * - 0: Complete blackout
 * 
 * @param input - Current review metadata and answer quality
 * @returns Updated review schedule
 */
export function calculateSM2({ easeFactor, interval, repetitions, quality }: SM2Input): SM2Result {
  // Clamp quality to 0-5 range
  const q = Math.max(0, Math.min(5, quality));

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (q >= 3) {
    // Correct answer (quality >= 3)
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions += 1;
  } else {
    // Incorrect answer (quality < 3) - reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor
  newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

/**
 * Convert answer correctness to SM-2 quality rating
 * 
 * @param isCorrect - Whether the answer was correct
 * @param confidenceLevel - Optional confidence level (0-1)
 * @returns SM-2 quality rating (0-5)
 */
export function getQualityRating(isCorrect: boolean, confidenceLevel?: number): number {
  if (!isCorrect) {
    // Incorrect: return 0-2 based on confidence
    if (confidenceLevel !== undefined) {
      return Math.round(confidenceLevel * 2);
    }
    return 0;
  }

  // Correct: return 3-5 based on confidence
  if (confidenceLevel !== undefined) {
    return 3 + Math.round(confidenceLevel * 2);
  }
  return 4; // Default to "correct after hesitation"
}

/**
 * Check if a question is due for review
 * 
 * @param nextReviewDate - Scheduled review date
 * @param currentDate - Current date (defaults to now)
 * @returns True if the question is due for review
 */
export function isDueForReview(nextReviewDate: Date, currentDate: Date = new Date()): boolean {
  return currentDate >= nextReviewDate;
}

/**
 * Get initial review metadata for a new question
 * 
 * @returns Default SM-2 parameters
 */
export function getInitialReviewMetadata(): SM2Result {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(), // Due immediately
  };
}
