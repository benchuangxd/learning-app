import { Question, QuestionChoice, QuestionDifficulty, QuestionType } from '@/types/question';
import { preprocessOcrText, splitIntoBlocks } from '@/lib/ocr/text-preprocessor';

export interface OcrParseError {
  blockIndex: number;
  message: string;
  rawText: string;
}

export interface OcrParseResult {
  questions: Question[];
  errors: OcrParseError[];
  rawText: string;
}

const QUESTION_START_PATTERNS: RegExp[] = [
  /^(\d+)[\.\)\-:]\s+(.*)/, // 1. / 1) / 1- / 1:
  /^\((\d+)\)\s+(.*)/, // (1)
  /^[Qq](?:uestion)?\s*(\d+)[\.\)\-:]?\s*(.*)/i, // Q1 / Question 1
  /^#(\d+)\s+(.*)/, // #1
  /^\[(\d+)\]\s+(.*)/, // [1]
];

const CHOICE_PATTERNS: RegExp[] = [
  /^([A-Ja-j])[\.\)\-:]\s*(.*)/, // A. / a) / A- / a:
  /^\(([A-Ja-j])\)\s*(.*)/, // (A) / (a)
  /^([ivxIVX]+)[\.\)]\s*(.*)/, // i. / ii) (roman numerals)
];

function extractQuestionNumber(line: string): { number: number; text: string } | null {
  for (const pattern of QUESTION_START_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      const num = parseInt(match[1] ?? '0', 10);
      const text = match[2]?.trim() ?? '';
      if (!isNaN(num) && num > 0) {
        return { number: num, text };
      }
    }
  }
  return null;
}

function extractChoice(line: string): { label: string; text: string } | null {
  for (const pattern of CHOICE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      let label = match[1]?.toUpperCase() ?? '';

      if (/^[ivxIVX]+$/.test(label)) {
        const romanValues: Record<string, number> = { I: 1, V: 5, X: 10 };
        let value = 0;
        const upper = label.toUpperCase();
        for (let i = 0; i < upper.length; i++) {
          const current = romanValues[upper[i] ?? ''] ?? 0;
          const next = romanValues[upper[i + 1] ?? ''] ?? 0;
          if (current < next) {
            value -= current;
          } else {
            value += current;
          }
        }
        label = String.fromCharCode(64 + value);
      }

      return { label, text: match[2]?.trim() ?? '' };
    }
  }
  return null;
}

function isLikelyContinuation(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (extractChoice(trimmed)) return false;
  if (extractQuestionNumber(trimmed)) return false;

  const startsWithLowercase = /^[a-z]/.test(trimmed);
  const startsWithCommonWord =
    /^(and|or|the|a|an|is|are|was|were|that|which|who|when|where|how|why|but|if|then|so|as|for|with|to|of|in|on|at)\b/i.test(
      trimmed
    );

  return startsWithLowercase || startsWithCommonWord;
}

function parseBlock(block: string, blockIndex: number): Question | OcrParseError {
  const lines = block.split('\n').filter((l) => l.trim());

  if (lines.length === 0) {
    return { blockIndex, message: 'Empty block', rawText: block };
  }

  let questionText = '';
  const choices: QuestionChoice[] = [];
  let questionNumber: number | null = null;
  let parsingChoices = false;
  let currentChoiceText = '';
  let currentChoiceLabel = '';

  const finalizeCurrentChoice = (): void => {
    if (currentChoiceLabel && currentChoiceText.trim()) {
      choices.push({
        id: crypto.randomUUID(),
        label: currentChoiceLabel,
        text: currentChoiceText.trim(),
        isCorrect: false,
      });
    }
    currentChoiceLabel = '';
    currentChoiceText = '';
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (questionNumber === null) {
      const qMatch = extractQuestionNumber(trimmed);
      if (qMatch) {
        questionNumber = qMatch.number;
        if (qMatch.text) {
          questionText = qMatch.text;
        }
        continue;
      }
    }

    const choiceMatch = extractChoice(trimmed);
    if (choiceMatch) {
      finalizeCurrentChoice();
      parsingChoices = true;
      currentChoiceLabel = choiceMatch.label;
      currentChoiceText = choiceMatch.text;
      continue;
    }

    if (parsingChoices && isLikelyContinuation(trimmed)) {
      currentChoiceText += ' ' + trimmed;
      continue;
    }

    if (!parsingChoices) {
      if (questionText) {
        questionText += ' ' + trimmed;
      } else {
        questionText = trimmed;
      }
    }
  }

  finalizeCurrentChoice();

  if (!questionText.trim()) {
    return { blockIndex, message: 'No question text found', rawText: block };
  }

  if (choices.length < 2) {
    return {
      blockIndex,
      message: `Only ${choices.length} choice(s) found, need at least 2`,
      rawText: block,
    };
  }

  const sortedChoices = [...choices].sort((a, b) => a.label.localeCompare(b.label));
  for (let i = 0; i < sortedChoices.length; i++) {
    const choice = sortedChoices[i];
    if (choice) {
      choice.label = String.fromCharCode(65 + i);
    }
  }

  return {
    id: crypto.randomUUID(),
    text: questionText.trim(),
    questionType: QuestionType.MULTIPLE_CHOICE,
    points: 1,
    difficulty: QuestionDifficulty.MEDIUM,
    choices: sortedChoices,
    explanation: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function parseOcrText(input: string): OcrParseResult {
  if (!input || !input.trim()) {
    return { questions: [], errors: [], rawText: '' };
  }

  const preprocessed = preprocessOcrText(input);
  const blocks = splitIntoBlocks(preprocessed);

  const questions: Question[] = [];
  const errors: OcrParseError[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block) continue;

    const result = parseBlock(block, i);

    if ('id' in result) {
      questions.push(result);
    } else {
      errors.push(result);
    }
  }

  return { questions, errors, rawText: preprocessed };
}

export function setCorrectAnswer(question: Question, choiceId: string): Question {
  return {
    ...question,
    choices: question.choices.map((c) => ({
      ...c,
      isCorrect: c.id === choiceId,
    })),
    updatedAt: new Date(),
  };
}

export function toggleCorrectAnswer(question: Question, choiceId: string): Question {
  return {
    ...question,
    choices: question.choices.map((c) => ({
      ...c,
      isCorrect: c.id === choiceId ? !c.isCorrect : c.isCorrect,
    })),
    updatedAt: new Date(),
  };
}

export function hasCorrectAnswer(question: Question): boolean {
  return question.choices.some((c) => c.isCorrect);
}
