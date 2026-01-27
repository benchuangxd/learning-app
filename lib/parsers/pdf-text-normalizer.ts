interface ExtractedQuestion {
  number: number;
  text: string;
  options: Array<{ label: string; text: string; isCorrect: boolean }>;
  explanation: string;
}

export function preprocessPDFExtractedText(input: string): string {
  const isMultiColumn = detectMultiColumn(input);

  if (!isMultiColumn) {
    return normalizePDFText(input);
  }

  const questions = extractQuestionsFromMultiColumn(input);

  if (questions.length === 0) {
    return normalizePDFText(input);
  }

  return formatQuestionsAsMarkdown(questions);
}

export function detectMultiColumn(input: string): boolean {
  return /Question\s+\d+[^Q]*Question\s+\d+/i.test(input);
}

function extractQuestionsFromMultiColumn(input: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  const text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const headerPattern = /Question\s+(\d+)\s*\(?(\d+)\s*point[s]?\)?/gi;
  const headers: Array<{ number: number; points: number; index: number }> = [];

  let match;
  while ((match = headerPattern.exec(text)) !== null) {
    headers.push({
      number: parseInt(match[1] ?? '0', 10),
      points: parseInt(match[2] ?? '1', 10),
      index: match.index,
    });
  }

  headers.sort((a, b) => a.number - b.number);

  const optionPattern = /\b([A-E])\.\s+([^A-E\n✅]+(?:[^A-E\n]*)?)(✅)?/g;
  const allOptions: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
    index: number;
  }> = [];

  while ((match = optionPattern.exec(text)) !== null) {
    const optText = (match[2] ?? '').trim();
    if (optText.length > 1 && !optText.match(/^(point|Question)/i)) {
      allOptions.push({
        label: match[1] ?? '',
        text: optText,
        isCorrect: Boolean(match[3]),
        index: match.index,
      });
    }
  }

  const explanationPattern = /[—–-]\s*([A-Z][^—–\n]{20,})/g;
  const explanations: Array<{ text: string; index: number }> = [];

  while ((match = explanationPattern.exec(text)) !== null) {
    explanations.push({
      text: (match[1] ?? '').trim(),
      index: match.index,
    });
  }

  const questionTexts = findQuestionTexts(text, headers);

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (!header) continue;

    const qNum = header.number;
    const qText = questionTexts.get(qNum) ?? '';

    const optionsForQ = findOptionsForQuestion(allOptions, qNum, headers.length);
    const explanation = findExplanationForQuestion(explanations, qNum, headers.length);

    if (qText && optionsForQ.length > 0) {
      questions.push({
        number: qNum,
        text: qText,
        options: optionsForQ,
        explanation: explanation,
      });
    }
  }

  return questions;
}

function findQuestionTexts(
  text: string,
  headers: Array<{ number: number; index: number }>
): Map<number, string> {
  const result = new Map<number, string>();

  const sentences = text.split(/(?<=[.?])\s+/);

  for (const header of headers) {
    const qNum = header.number;

    const patterns = [
      /Which of the following[^?]*\?/i,
      /What is[^?]*\?/i,
      /What type[^?]*\?/i,
      /Which one[^?]*\?/i,
      /Which best[^?]*\?/i,
      /Which is[^?]*\?/i,
      /Choose[^?]*[.?]/i,
      /Select[^?]*\?/i,
      /A\s+\w+[^?]*\?/i,
      /The\s+\w+[^?]*\?/i,
    ];

    for (const sentence of sentences) {
      for (const pattern of patterns) {
        const match = sentence.match(pattern);
        if (match && !result.has(qNum)) {
          let qText = match[0].trim();
          qText = qText.replace(/^[A-E]\.\s*/, '');
          if (qText.length > 15 && qText.length < 300) {
            result.set(qNum, qText);
            break;
          }
        }
      }
      if (result.has(qNum)) break;
    }
  }

  return result;
}

function findOptionsForQuestion(
  allOptions: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
    index: number;
  }>,
  questionNum: number,
  _totalQuestions: number
): Array<{ label: string; text: string; isCorrect: boolean }> {
  const optionsByLabel = new Map<
    string,
    Array<{ text: string; isCorrect: boolean; index: number }>
  >();

  for (const opt of allOptions) {
    if (!optionsByLabel.has(opt.label)) {
      optionsByLabel.set(opt.label, []);
    }
    optionsByLabel.get(opt.label)!.push({
      text: opt.text,
      isCorrect: opt.isCorrect,
      index: opt.index,
    });
  }

  const result: Array<{ label: string; text: string; isCorrect: boolean }> = [];

  for (const label of ['A', 'B', 'C', 'D', 'E']) {
    const options = optionsByLabel.get(label);
    if (!options || options.length === 0) continue;

    const idx = (questionNum - 1) % options.length;
    const opt = options[idx];
    if (opt) {
      result.push({
        label,
        text: opt.text,
        isCorrect: opt.isCorrect,
      });
    }
  }

  return result;
}

function findExplanationForQuestion(
  explanations: Array<{ text: string; index: number }>,
  questionNum: number,
  _totalQuestions: number
): string {
  if (explanations.length === 0) return '';

  const idx = (questionNum - 1) % explanations.length;
  return explanations[idx]?.text ?? '';
}

function formatQuestionsAsMarkdown(questions: ExtractedQuestion[]): string {
  const lines: string[] = [];

  for (const q of questions) {
    lines.push(`**Question ${q.number} (1 point)**`);
    lines.push('');
    lines.push(q.text);
    lines.push('');

    for (const opt of q.options) {
      const marker = opt.isCorrect ? ' ✅' : '';
      lines.push(`${opt.label}. ${opt.text}${marker}`);
    }

    if (q.explanation) {
      lines.push('');
      lines.push(`— ${q.explanation}`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function normalizePDFText(input: string): string {
  let text = input;

  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/[ \t]+/g, ' ');

  text = text.replace(
    /(Question\s+(\d+)\s*)\(?(\d+)\s*point[s]?\)?/gi,
    '\n\n**Question $2 ($3 point)**\n'
  );

  text = text.replace(/(?<!\n)([A-E])\.\s+/g, '\n$1. ');

  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');

  const lines = text.split('\n');
  const processedLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      processedLines.push('');
      continue;
    }

    if (line.match(/^Introduction to|^Embedded Systems\d*$/i)) {
      continue;
    }

    processedLines.push(line);
  }

  return processedLines.join('\n').trim();
}
