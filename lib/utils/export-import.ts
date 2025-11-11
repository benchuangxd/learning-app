import type { Question } from '@/types/question';

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

const EXPORT_VERSION = '1.0';

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

/**
 * Validate imported question data
 */
function validateQuestion(question: unknown, index: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof question !== 'object' || question === null) {
    errors.push(`Question ${index + 1}: Invalid question object`);
    return { valid: false, errors };
  }

  const q = question as Record<string, unknown>;

  // Required fields
  if (!q.id || typeof q.id !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'id'`);
  }
  if (!q.text || typeof q.text !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'text'`);
  }
  if (!q.explanation || typeof q.explanation !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'explanation'`);
  }
  if (typeof q.points !== 'number' || q.points < 1) {
    errors.push(`Question ${index + 1}: Missing or invalid 'points'`);
  }
  if (!q.difficulty || typeof q.difficulty !== 'string') {
    errors.push(`Question ${index + 1}: Missing or invalid 'difficulty'`);
  }
  if (!Array.isArray(q.choices) || q.choices.length < 1) {
    errors.push(`Question ${index + 1}: Missing or invalid 'choices' array`);
  } else {
    // Validate choices structure
    const hasValidChoices = q.choices.every((choice: unknown) => {
      return typeof choice === 'object' && choice !== null && 
             typeof (choice as Record<string, unknown>).text === 'string';
    });
    
    if (!hasValidChoices) {
      errors.push(`Question ${index + 1}: Invalid choice structure`);
    }
    
    // Check for at least one correct answer (unless it's a sorting question)
    const hasCorrectAnswer = q.choices.some((choice: unknown) => {
      return typeof choice === 'object' && choice !== null && (choice as Record<string, unknown>).isCorrect === true;
    });
    
    const isSortingQuestion = typeof q.text === 'string' && q.text.toLowerCase().includes('sort');
    const isFillInBlank = typeof q.text === 'string' && q.text.includes('___') && q.choices.length === 1;
    
    // For regular questions (not sorting or fill-in-blank), require correct answer
    if (!hasCorrectAnswer && !isSortingQuestion && !isFillInBlank) {
      errors.push(`Question ${index + 1}: No correct answer marked (unless it's a sorting/fill-in-blank question)`);
    }
  }

  return { valid: errors.length === 0, errors };
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
        if (validation.valid) {
          questions.push(question as Question);
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
        if (validation.valid) {
          questions.push(question as Question);
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
