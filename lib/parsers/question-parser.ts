import { Question, QuestionChoice, QuestionDifficulty } from '@/types/question';

/**
 * Error encountered during parsing
 */
export interface ParseError {
  /** Line number where error occurred */
  line: number;
  /** Error message */
  message: string;
}

/**
 * Result of parsing questions
 */
export interface ParseResult {
  /** Successfully parsed questions */
  questions: Question[];
  /** Errors encountered during parsing */
  errors: ParseError[];
}

/**
 * Parse questions from markdown format
 *
 * Expected format:
 * **Question 1 (1 point)**
 * Which of the following...?
 * A. Option A
 * B. Option B
 * C. Option C
 * D. Option D ✅
 * — Explanation text here
 *
 * @param input - Raw markdown string
 * @returns Parsed questions and any errors
 */
export function parseQuestions(input: string): ParseResult {
  const questions: Question[] = [];
  const errors: ParseError[] = [];

  if (!input || input.trim().length === 0) {
    errors.push({ line: 0, message: 'Input is empty' });
    return { questions, errors };
  }

  // Split by --- separator OR by question headers
  // First, normalize by ensuring each question starts on a new block
  const normalizedInput = input.replace(/\n---+\n/g, '\n___SEPARATOR___\n');
  
  // Split by either separator or question header
  const blocks: string[] = [];
  const lines = normalizedInput.split('\n');
  let currentBlock = '';
  
  for (const line of lines) {
    if (line.trim() === '___SEPARATOR___') {
      if (currentBlock.trim()) {
        blocks.push(currentBlock.trim());
      }
      currentBlock = '';
    } else if (line.match(/^\*\*Question\s+\d+/i) && currentBlock.trim()) {
      // New question header found, save current block and start new one
      blocks.push(currentBlock.trim());
      currentBlock = line + '\n';
    } else {
      currentBlock += line + '\n';
    }
  }
  
  // Add last block
  if (currentBlock.trim()) {
    blocks.push(currentBlock.trim());
  }
  
  const questionBlocks = blocks.filter((block) => block.trim());

  for (const block of questionBlocks) {
    const lines = block.split('\n');
    let currentQuestion: Partial<Question> | null = null;
    const currentChoices: QuestionChoice[] = [];
    let questionText = '';
    let explanation = '';
    let choiceCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();

      if (!line) continue;

      // Match question header: **Question 1 (1 point)**
      const headerMatch = line.match(/\*\*Question\s+\d+\s*\((\d+)\s*point[s]?\)\*\*/i);
      if (headerMatch) {
        const points = parseInt(headerMatch[1] ?? '1', 10);
        currentQuestion = { points, difficulty: QuestionDifficulty.MEDIUM };
        continue;
      }

      // Skip "Options:", "Choices:", etc. (common separators between question and choices)
      if (line.match(/^(Options|Choices|Answers)\s*:?\s*$/i)) {
        continue;
      }

      // Match explanation: — Explanation text (em dash)
      if (line.startsWith('—')) {
        explanation = line.replace(/^—\s*/, '');
        continue;
      }

      // Match A-D choice: A. Text or A. Text ✅
      const adChoiceMatch = line.match(/^([A-F])\.\s*(.+?)(\s*✅)?$/);
      if (adChoiceMatch && currentQuestion) {
        const label = adChoiceMatch[1] ?? '';
        const text = adChoiceMatch[2]?.trim() ?? '';
        const isCorrect = Boolean(adChoiceMatch[3]);

        currentChoices.push({
          id: crypto.randomUUID(),
          label,
          text,
          isCorrect,
        });
        continue;
      }

      // Match bullet choice: - Text or - Text ✅ (for bullet list format)
      const bulletChoiceMatch = line.match(/^-\s+(.+?)(\s*✅)?$/);
      if (bulletChoiceMatch && currentQuestion && questionText) {
        choiceCounter++;
        const label = String.fromCharCode(64 + choiceCounter); // A, B, C, D...
        const text = bulletChoiceMatch[1]?.trim() ?? '';
        const isCorrect = Boolean(bulletChoiceMatch[2]);

        currentChoices.push({
          id: crypto.randomUUID(),
          label,
          text,
          isCorrect,
        });
        continue;
      }

      // If we have a current question and no choices yet, it's the question text
      if (currentQuestion && currentChoices.length === 0 && !line.startsWith('—')) {
        if (questionText) {
          questionText += ' ' + line;
        } else {
          questionText = line;
        }
      }
    }

    // Finish the question for this block
    if (currentQuestion && questionText && currentChoices.length > 0) {
      const correctAnswers = currentChoices.filter((c) => c.isCorrect);

      if (correctAnswers.length === 0) {
        errors.push({
          line: 0,
          message: `Question "${questionText.substring(0, 50)}..." must have at least one correct answer (marked with ✅)`,
        });
      }

      const question: Question = {
        id: crypto.randomUUID(),
        text: questionText.trim(),
        points: currentQuestion.points ?? 1,
        difficulty: currentQuestion.difficulty ?? QuestionDifficulty.MEDIUM,
        choices: currentChoices,
        explanation: explanation.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      questions.push(question);
    }
  }

  return { questions, errors };
}

/**
 * Validate a single question
 */
export function validateQuestion(question: Question): string[] {
  const errors: string[] = [];

  if (!question.text || question.text.trim().length === 0) {
    errors.push('Question text is required');
  }

  if (question.choices.length < 2) {
    errors.push('Question must have at least 2 choices');
  }

  if (question.choices.length > 6) {
    errors.push('Question cannot have more than 6 choices');
  }

  const correctChoices = question.choices.filter((c) => c.isCorrect);
  if (correctChoices.length === 0) {
    errors.push('Question must have at least one correct answer');
  }

  // Note: Multiple correct answers are allowed
  // This supports both single-answer and multiple-answer questions

  const labels = new Set<string>();
  for (const choice of question.choices) {
    if (labels.has(choice.label)) {
      errors.push(`Duplicate choice label: ${choice.label}`);
    }
    labels.add(choice.label);

    if (!choice.text || choice.text.trim().length === 0) {
      errors.push(`Choice ${choice.label} has no text`);
    }
  }

  return errors;
}
