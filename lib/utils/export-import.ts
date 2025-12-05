import type { Question } from '@/types/question';
import { detectQuestionType } from '@/lib/storage/migration';

export interface ExportData {
  version: string;
  exportDate: string;
  questionCount: number;
  questions: Question[];
}

export interface ImportResult {
  success: boolean;
  questions: Question[];
  errors: string[];
  warnings: string[];
}

const EXPORT_VERSION = '1.1';

/**
 * Export questions to JSON file
 */
export function exportQuestionsToJSON(questions: Question[]): void {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    questionCount: questions.length,
    questions,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `learning-app-questions-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Valid question type values */
const VALID_QUESTION_TYPES = ['multiple_choice', 'sorting', 'fill_in_blank'] as const;

/**
 * Validate imported question data
 */
function validateQuestion(
  question: unknown,
  index: number
): { valid: boolean; errors: string[]; warnings: string[]; needsTypeDetection: boolean } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let needsTypeDetection = false;

  if (typeof question !== 'object' || question === null) {
    errors.push(`Question ${index + 1}: Invalid question object`);
    return { valid: false, errors, warnings, needsTypeDetection };
  }

  const q = question as Record<string, unknown>;

  // Required fields
  if (!q.id || typeof q.id !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'id'`);
  }
  if (!q.text || typeof q.text !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'text'`);
  }
  // Explanation can be blank, but must exist as a string
  if (typeof q.explanation !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'explanation' (must be a string, can be empty)`);
  }
  if (typeof q.points !== 'number' || q.points < 1) {
    errors.push(`Question ${index + 1}: Missing or invalid 'points'`);
  }
  if (!q.difficulty || typeof q.difficulty !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'difficulty'`);
  }

  // Validate questionType field (optional for v1.0 compatibility)
  if (!q.questionType || typeof q.questionType !== 'string') {
    // v1.0 format - questionType will be auto-detected
    warnings.push(`Question ${index + 1}: Missing 'questionType' field (v1.0 format). Type will be auto-detected.`);
    needsTypeDetection = true;
  } else if (!VALID_QUESTION_TYPES.includes(q.questionType as typeof VALID_QUESTION_TYPES[number])) {
    errors.push(
      `Question ${index + 1}: Invalid 'questionType' value '${q.questionType}'. ` +
        `Must be one of: ${VALID_QUESTION_TYPES.join(', ')}`
    );
  }

  if (!Array.isArray(q.choices) || q.choices.length < 1) {
    errors.push(`Question ${index + 1}: Missing or invalid 'choices' array`);
  } else {
    // Validate choices structure
    const hasValidChoices = q.choices.every((choice: unknown) => {
      return (
        typeof choice === 'object' &&
        choice !== null &&
        typeof (choice as Record<string, unknown>).text === 'string'
      );
    });

    if (!hasValidChoices) {
      errors.push(`Question ${index + 1}: Invalid choice structure`);
    }

    // Type-specific validation based on questionType
    if (q.questionType === 'sorting') {
      // Validate sorting questions: require correctOrder on all choices
      const allHaveOrder = q.choices.every((choice: unknown) => {
        return (
          typeof choice === 'object' &&
          choice !== null &&
          typeof (choice as Record<string, unknown>).correctOrder === 'number'
        );
      });

      if (!allHaveOrder) {
        errors.push(`Question ${index + 1}: Sorting questions require correctOrder on all choices`);
      } else {
        // Validate order numbers
        const orders = q.choices.map((choice: unknown) => {
          return (choice as Record<string, unknown>).correctOrder as number;
        });

        // Check uniqueness
        const uniqueOrders = new Set(orders);
        if (uniqueOrders.size !== q.choices.length) {
          errors.push(`Question ${index + 1}: Sorting question has duplicate order numbers`);
        }

        // Check sequential (1, 2, 3, 4...)
        const sortedOrders = [...orders].sort((a, b) => a - b);
        const expectedOrders = Array.from({ length: q.choices.length }, (_, i) => i + 1);
        const isSequential = sortedOrders.every((order, i) => order === expectedOrders[i]);

        if (!isSequential) {
          errors.push(`Question ${index + 1}: Sorting question order numbers must be sequential (1, 2, 3...)`);
        }
      }
    } else if (q.questionType === 'fill_in_blank') {
      // Validate fill-in-blank: require ___ in text
      if (typeof q.text === 'string' && !q.text.includes('___')) {
        errors.push(`Question ${index + 1}: Fill-in-blank questions must contain '___' in text`);
      }

      // Require correct answer marked
      const hasCorrectAnswer = q.choices.some((choice: unknown) => {
        return (
          typeof choice === 'object' &&
          choice !== null &&
          (choice as Record<string, unknown>).isCorrect === true
        );
      });

      if (!hasCorrectAnswer) {
        errors.push(`Question ${index + 1}: Fill-in-blank question must have correct answer marked`);
      }
    } else if (q.questionType === 'multiple_choice') {
      // Validate multiple choice: require at least one correct answer
      const hasCorrectAnswer = q.choices.some((choice: unknown) => {
        return (
          typeof choice === 'object' &&
          choice !== null &&
          (choice as Record<string, unknown>).isCorrect === true
        );
      });

      if (!hasCorrectAnswer) {
        errors.push(`Question ${index + 1}: Multiple choice questions must have at least one correct answer`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings, needsTypeDetection };
}

/**
 * Parse and validate imported JSON
 */
export function parseImportedJSON(jsonString: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const data = JSON.parse(jsonString) as unknown;

    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        questions: [],
        errors: ['Invalid JSON format: Expected an object'],
        warnings: [],
      };
    }

    const importData = data as Record<string, unknown>;

    // Check if it's our export format
    if ('version' in importData && 'questions' in importData) {
      // Our format
      if (importData.version !== EXPORT_VERSION) {
        warnings.push(`Version mismatch: Expected ${EXPORT_VERSION}, got ${importData.version}`);
      }

      if (!Array.isArray(importData.questions)) {
        return {
          success: false,
          questions: [],
          errors: ['Invalid format: questions must be an array'],
          warnings,
        };
      }

      const questions: Question[] = [];
      importData.questions.forEach((question: unknown, index: number) => {
        const validation = validateQuestion(question, index);
        warnings.push(...validation.warnings);
        if (validation.valid) {
          let q = question as Question;
          // Auto-detect questionType for v1.0 imports
          if (validation.needsTypeDetection) {
            q = {
              ...q,
              questionType: detectQuestionType({ text: q.text, choices: q.choices }),
            };
          }
          questions.push(q);
        } else {
          errors.push(...validation.errors);
        }
      });

      return {
        success: questions.length > 0,
        questions,
        errors,
        warnings,
      };
    } else if (Array.isArray(data)) {
      // Plain array of questions
      const questions: Question[] = [];
      data.forEach((question: unknown, index: number) => {
        const validation = validateQuestion(question, index);
        warnings.push(...validation.warnings);
        if (validation.valid) {
          let q = question as Question;
          // Auto-detect questionType for v1.0 imports
          if (validation.needsTypeDetection) {
            q = {
              ...q,
              questionType: detectQuestionType({ text: q.text, choices: q.choices }),
            };
          }
          questions.push(q);
        } else {
          errors.push(...validation.errors);
        }
      });

      return {
        success: questions.length > 0,
        questions,
        errors,
        warnings: ['Imported plain array format (no version info)'],
      };
    } else {
      return {
        success: false,
        questions: [],
        errors: ['Invalid format: Expected questions array or export object'],
        warnings,
      };
    }
  } catch (error) {
    return {
      success: false,
      questions: [],
      errors: [`JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * Generate new IDs for imported questions to avoid conflicts
 */
export function regenerateQuestionIDs(questions: Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    id: crypto.randomUUID(),
    choices: question.choices.map((choice) => ({
      ...choice,
      id: crypto.randomUUID(),
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}
