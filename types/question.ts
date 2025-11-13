/**
 * Question difficulty levels
 */
export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * A single choice in a multiple-choice question
 */
export interface QuestionChoice {
  /** Unique identifier for the choice */
  id: string;
  /** Choice label (A, B, C, D) */
  label: string;
  /** The text content of the choice */
  text: string;
  /** Whether this is the correct answer */
  isCorrect: boolean;
  /** For sorting questions: the correct position (1, 2, 3, 4...) */
  correctOrder?: number;
}

/**
 * A question with multiple choices
 */
export interface Question {
  /** Unique identifier */
  id: string;
  /** The question text */
  text: string;
  /** Points awarded for correct answer */
  points: number;
  /** Difficulty level */
  difficulty: QuestionDifficulty;
  /** Array of choices (typically 4) */
  choices: QuestionChoice[];
  /** Explanation shown after answering */
  explanation: string;
  /** Optional category for organization */
  category?: string;
  /** Optional tags for filtering */
  tags?: string[];
  /** When the question was created */
  createdAt: Date;
  /** When the question was last updated */
  updatedAt: Date;
}

/**
 * Record of a single question attempt
 */
export interface QuestionAttempt {
  /** ID of the question attempted */
  questionId: string;
  /** ID of the choice that was selected */
  selectedChoiceId: string;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** When the attempt was made */
  timestamp: Date;
}

/**
 * A study session containing multiple question attempts
 */
export interface StudySession {
  /** Unique session identifier */
  id: string;
  /** When the session started */
  startTime: Date;
  /** When the session ended (undefined if still active) */
  endTime?: Date;
  /** All attempts made during this session */
  attempts: QuestionAttempt[];
  /** Current score (number of correct answers) */
  score: number;
  /** Whether the session is currently active */
  isActive: boolean;
}

/**
 * Metadata for spaced repetition algorithm
 */
export interface ReviewMetadata {
  /** Question ID this metadata is for */
  questionId: string;
  /** Easiness factor (1.3 - 2.5) for SM-2 algorithm */
  easinessFactor: number;
  /** Current interval in days */
  interval: number;
  /** Number of consecutive correct repetitions */
  repetitions: number;
  /** When the question should be reviewed next */
  nextReviewDate: Date;
  /** Last time the question was reviewed */
  lastReviewed?: Date;
}
