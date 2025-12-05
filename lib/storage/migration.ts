import type { Question, QuestionChoice } from '@/types/question';
import { QuestionType } from '@/types/question';

/**
 * Legacy question type (without questionType field)
 */
type LegacyQuestion = Omit<Question, 'questionType'>;

/**
 * Detect question type from question structure (legacy detection)
 * Used for migrating old questions that don't have questionType field
 */
export function detectQuestionType(
  question: LegacyQuestion | { text: string; choices: QuestionChoice[] }
): QuestionType {
  // Check for sorting question: has correctOrder on any choice
  const hasSortingFields = question.choices.some(
    (choice) => typeof choice.correctOrder === 'number'
  );
  if (hasSortingFields) {
    return QuestionType.SORTING;
  }

  // Check for fill-in-blank: text contains ___ and single choice
  const isFillInBlank =
    question.text.includes('___') && question.choices.length === 1;
  if (isFillInBlank) {
    return QuestionType.FILL_IN_BLANK;
  }

  // Default to multiple choice
  return QuestionType.MULTIPLE_CHOICE;
}

/**
 * Migrate legacy questions to include questionType field
 * Returns migrated questions and count of migrations performed
 */
export function migrateQuestions(
  questions: Array<Question | LegacyQuestion>
): { questions: Question[]; migratedCount: number } {
  let migratedCount = 0;

  const migrated = questions.map((q) => {
    // Check if already has questionType
    if ('questionType' in q && q.questionType) {
      return q as Question;
    }

    // Migrate: detect and add questionType
    migratedCount++;
    return {
      ...q,
      questionType: detectQuestionType(q as LegacyQuestion),
    } as Question;
  });

  return { questions: migrated, migratedCount };
}
