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
    let isReadingExplanation = false;
    let isInCodeBlock = false;
    let codeBlockLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      if (rawLine === undefined) continue;
      
      const line = rawLine.trim();

      if (!line && !isInCodeBlock) continue;
      
      // Handle code block delimiters
      if (line.startsWith('```')) {
        if (isInCodeBlock) {
          // End of code block
          isInCodeBlock = false;
          // Add code block to question text
          if (questionText) {
            questionText += '\n\n```\n' + codeBlockLines.join('\n') + '\n```';
          }
          codeBlockLines = [];
        } else {
          // Start of code block
          isInCodeBlock = true;
        }
        continue;
      }
      
      // If we're inside a code block, collect the lines
      if (isInCodeBlock) {
        codeBlockLines.push(rawLine); // Keep original line with indentation
        continue;
      }
      
      // Skip image references (e.g., ![image](path))
      if (line.startsWith('![')) {
        continue;
      }

      // Match question header: **Question 1 (1 point)** or **Question 1 (1 point, multiple choice)** or **Question 1 (1 point) 666**
      const headerMatch = line.match(/\*\*Question\s+\d+\s*\((\d+)\s*point[s]?(?:,\s*[^)]+)?\)\*\*(?:\s+\d+)?/i);
      if (headerMatch) {
        const points = parseInt(headerMatch[1] ?? '1', 10);
        currentQuestion = { points, difficulty: QuestionDifficulty.MEDIUM };
        continue;
      }

      // Skip "Options:", "Choices:", etc. (common separators between question and choices)
      if (line.match(/^(Options|Choices|Answers)\s*:?\s*$/i)) {
        continue;
      }

      // Match explanation: — Explanation text (em dash) OR **Explanation:**
      if (line.startsWith('—')) {
        explanation = line.replace(/^—\s*/, '');
        isReadingExplanation = true;
        continue;
      }
      
      // Match **Explanation:** header
      if (line.match(/^\*\*Explanation:?\*\*\s*$/i)) {
        isReadingExplanation = true;
        // Explanation content comes on next lines
        let j = i + 1;
        const explanationLines: string[] = [];
        while (j < lines.length && lines[j]?.trim()) {
          explanationLines.push(lines[j]?.trim() ?? '');
          j++;
        }
        explanation = explanationLines.join(' ');
        i = j - 1; // Skip the lines we processed
        continue;
      }
      
      // If we're reading explanation, continue adding text
      if (isReadingExplanation && !line.startsWith('**') && !line.match(/^-{3,}/)) {
        // Continue adding to explanation
        if (explanation) {
          explanation += ' ' + line;
        } else {
          explanation = line;
        }
        continue;
      }

      // Match A-J choice or #N choice (for sorting questions): A. Text or #1 Text
      // But NOT if we're already reading the explanation
      const adChoiceMatch = line.match(/^([A-J])\.\s*(.+?)(\s*✅.*)?$/);
      const sortChoiceMatch = line.match(/^#(\d+)\s+(.+?)(\s*✅.*)?$/);
      
      if (adChoiceMatch && currentQuestion && !isReadingExplanation) {
        const label = adChoiceMatch[1] ?? '';
        let text = adChoiceMatch[2]?.trim() ?? '';
        const checkmarkPart = adChoiceMatch[3] ?? '';
        const isCorrect = checkmarkPart.includes('✅');
        
        // If there's text after ✅ in parentheses, include it in the choice text
        if (checkmarkPart && checkmarkPart.includes('(')) {
          text += ' ' + checkmarkPart.replace('✅', '').trim();
        }

        currentChoices.push({
          id: crypto.randomUUID(),
          label,
          text,
          isCorrect,
        });
        continue;
      }
      
      // Handle sorting questions with #N format (e.g., #1 Desk-checking, #2 Hardware Breakpoints)
      if (sortChoiceMatch && currentQuestion && !isReadingExplanation) {
        const sortNumber = sortChoiceMatch[1] ?? '';
        let text = sortChoiceMatch[2]?.trim() ?? '';
        const checkmarkPart = sortChoiceMatch[3] ?? '';
        const isCorrect = checkmarkPart.includes('✅');
        
        if (checkmarkPart && checkmarkPart.includes('(')) {
          text += ' ' + checkmarkPart.replace('✅', '').trim();
        }
        
        // Convert #1, #2, #3, #4 to A, B, C, D
        const label = String.fromCharCode(64 + parseInt(sortNumber));
        const correctOrder = parseInt(sortNumber);
        
        currentChoices.push({
          id: crypto.randomUUID(),
          label,
          text,
          isCorrect,
          correctOrder, // Store the correct position for sorting validation
        });
        continue;
      }

      // Match bullet choice: - Text or - Text ✅ (for bullet list format)
      // But NOT if we're already reading the explanation
      const bulletChoiceMatch = line.match(/^-\s+(.+?)(\s*✅)?$/);
      if (bulletChoiceMatch && currentQuestion && questionText && !isReadingExplanation) {
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

      // Check if this line is an answer to a fill-in-the-blank with ___ (e.g., "✅ **A = 75 ms**")
      if (currentQuestion && questionText.includes('___') && currentChoices.length === 0 && line.match(/^\s*✅\s*\*\*(.+?)\*\*/)) {
        // This is the answer line for a fill-in-the-blank question
        const answerMatch = line.match(/✅\s*\*\*(.+?)\*\*/);
        if (answerMatch) {
          const answerText = answerMatch[1]?.trim() ?? '';
          currentChoices.push({
            id: crypto.randomUUID(),
            label: 'A',
            text: answerText,
            isCorrect: true,
          });
        }
        continue;
      }

      // If we have a current question and no choices yet, it's the question text
      if (currentQuestion && currentChoices.length === 0 && !line.startsWith('—') && !line.startsWith('✅')) {
        if (questionText) {
          questionText += ' ' + line;
        } else {
          questionText = line;
        }
      }
    }

    // Finish the question for this block
    if (currentQuestion && questionText) {
      // Handle questions with bold words but no ✅ (e.g., "A **30,000,000** count is used...")
      if (currentChoices.length === 0 && !questionText.includes('✅') && questionText.match(/\*\*([^*]+)\*\*/g)) {
        const boldMatches = questionText.match(/\*\*([^*]+)\*\*/g);
        if (boldMatches) {
          const answers = boldMatches.map(match => match.replace(/\*\*/g, ''));
          
          // Replace bold words with blanks
          let questionWithBlanks = questionText;
          boldMatches.forEach(() => {
            questionWithBlanks = questionWithBlanks.replace(/\*\*([^*]+)\*\*/, '___');
          });
          
          currentChoices.push({
            id: crypto.randomUUID(),
            label: 'A',
            text: answers.join(', '),
            isCorrect: true,
          });
          
          questionText = questionWithBlanks;
        }
      }
      
      // Handle statement-style questions with ✅ at the end
      if (currentChoices.length === 0 && questionText.includes('✅')) {
        // Remove the checkmark from question text
        const cleanedText = questionText.replace(/\s*✅\s*$/, '').trim();
        
        // Check if this is a fill-in-the-blank question (has **bold** words)
        const boldMatches = cleanedText.match(/\*\*([^*]+)\*\*/g);
        
        if (boldMatches && boldMatches.length > 0) {
          // Fill-in-the-blank question
          // Extract the bold words (answers)
          const answers = boldMatches.map(match => match.replace(/\*\*/g, ''));
          
          // Replace bold words with blanks in question text
          let questionWithBlanks = cleanedText;
          boldMatches.forEach(() => {
            questionWithBlanks = questionWithBlanks.replace(/\*\*([^*]+)\*\*/, '___');
          });
          
          // Create a single choice with the correct answer(s)
          currentChoices.push({
            id: crypto.randomUUID(),
            label: 'A',
            text: answers.join(', '),
            isCorrect: true,
          });
          
          questionText = questionWithBlanks;
        } else {
          // True/False question (no bold words)
          // Create True/False choices with True marked correct
          currentChoices.push(
            {
              id: crypto.randomUUID(),
              label: 'A',
              text: 'True',
              isCorrect: true,
            },
            {
              id: crypto.randomUUID(),
              label: 'B',
              text: 'False',
              isCorrect: false,
            }
          );
          
          questionText = cleanedText;
        }
      }
      
      if (currentChoices.length > 0) {
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

  if (question.choices.length > 10) {
    errors.push('Question cannot have more than 10 choices');
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
