/**
 * Service for managing spaced repetition reviews
 */

import type { Question, ReviewMetadata } from '@/types/question';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';
import {
  calculateSM2,
  getInitialReviewMetadata,
  isDueForReview,
  getQualityRating,
} from '@/lib/algorithms/sm2';

const reviewStorage = new LocalStorageAdapter<Record<string, ReviewMetadata>>(
  STORAGE_KEYS.REVIEW_METADATA
);

/**
 * Get review metadata for a question
 * If none exists, returns initial metadata
 */
export function getReviewMetadata(questionId: string): ReviewMetadata {
  const allMetadata = reviewStorage.get() ?? {};
  const metadata = allMetadata[questionId];

  if (metadata) {
    // Convert date strings back to Date objects
    const result: ReviewMetadata = {
      ...metadata,
      nextReviewDate: new Date(metadata.nextReviewDate),
    };
    
    if (metadata.lastReviewed) {
      result.lastReviewed = new Date(metadata.lastReviewed);
    }
    
    return result;
  }

  // Return initial metadata for new questions
  const initial = getInitialReviewMetadata();
  return {
    questionId,
    easinessFactor: initial.easeFactor,
    interval: initial.interval,
    repetitions: initial.repetitions,
    nextReviewDate: initial.nextReviewDate,
  };
}

/**
 * Update review metadata after answering a question
 */
export function updateReviewMetadata(
  questionId: string,
  isCorrect: boolean,
  confidenceLevel?: number
): ReviewMetadata {
  const currentMetadata = getReviewMetadata(questionId);
  const quality = getQualityRating(isCorrect, confidenceLevel);

  const result = calculateSM2({
    easeFactor: currentMetadata.easinessFactor,
    interval: currentMetadata.interval,
    repetitions: currentMetadata.repetitions,
    quality,
  });

  const newMetadata: ReviewMetadata = {
    questionId,
    easinessFactor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReviewDate: result.nextReviewDate,
    lastReviewed: new Date(),
  };

  // Save to storage
  const allMetadata = reviewStorage.get() ?? {};
  allMetadata[questionId] = newMetadata;
  reviewStorage.set(allMetadata);

  return newMetadata;
}

/**
 * Get all questions that are due for review
 */
export function getDueQuestions(questions: Question[]): Question[] {
  return questions.filter((question) => {
    const metadata = getReviewMetadata(question.id);
    return isDueForReview(metadata.nextReviewDate);
  });
}

/**
 * Get questions that have never been reviewed
 */
export function getNewQuestions(questions: Question[]): Question[] {
  return questions.filter((question) => {
    const metadata = getReviewMetadata(question.id);
    return !metadata.lastReviewed;
  });
}

/**
 * Get statistics about review progress
 */
export function getReviewStats(questions: Question[]): {
  total: number;
  new: number;
  learning: number;
  review: number;
  due: number;
} {
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let dueCount = 0;

  for (const question of questions) {
    const metadata = getReviewMetadata(question.id);

    if (!metadata.lastReviewed) {
      newCount++;
      dueCount++;
    } else if (metadata.repetitions < 2) {
      learningCount++;
      if (isDueForReview(metadata.nextReviewDate)) {
        dueCount++;
      }
    } else {
      reviewCount++;
      if (isDueForReview(metadata.nextReviewDate)) {
        dueCount++;
      }
    }
  }

  return {
    total: questions.length,
    new: newCount,
    learning: learningCount,
    review: reviewCount,
    due: dueCount,
  };
}

/**
 * Reset all review metadata (for testing or starting fresh)
 */
export function resetAllReviews(): void {
  reviewStorage.set({});
}

/**
 * Get next review date for a question
 */
export function getNextReviewDate(questionId: string): Date {
  const metadata = getReviewMetadata(questionId);
  return metadata.nextReviewDate;
}

/**
 * Check if a question is due for review
 */
export function isQuestionDue(questionId: string): boolean {
  const metadata = getReviewMetadata(questionId);
  return isDueForReview(metadata.nextReviewDate);
}
