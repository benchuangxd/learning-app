/**
 * OCR Text Preprocessor
 * Cleans and normalizes OCR output for better question parsing
 */

/**
 * Common OCR character substitution errors and their corrections
 */
const OCR_SUBSTITUTIONS: [RegExp, string][] = [
  // Letter/number confusion
  [/(?<![a-zA-Z])l(?=\d)/g, '1'], // l before digit -> 1
  [/(?<=\d)l(?![a-zA-Z])/g, '1'], // l after digit -> 1
  [/(?<![a-zA-Z])O(?=\d)/g, '0'], // O before digit -> 0
  [/(?<=\d)O(?![a-zA-Z])/g, '0'], // O after digit -> 0

  // Common misreads
  [/\bCc\b/g, 'c'], // Cc -> c
  [/\brn\b/g, 'm'], // rn -> m (common OCR error)
  [/\bvv\b/g, 'w'], // vv -> w

  // Punctuation normalization
  [/[''`]/g, "'"], // Smart quotes to straight
  [/[""]/g, '"'], // Smart double quotes
  [/…/g, '...'], // Ellipsis
  [/—/g, '-'], // Em dash to hyphen
  [/–/g, '-'], // En dash to hyphen
];

/**
 * Patterns that indicate page numbers/headers to remove
 */
const PAGE_NOISE_PATTERNS = [
  /^\s*Page\s+\d+\s*(?:of\s+\d+)?\s*$/gim,
  /^\s*\d+\s*$/gm, // Standalone numbers (page numbers)
  /^[-_=]{3,}$/gm, // Horizontal lines
  /^\s*(?:continued|cont'd)\.?\s*$/gim,
];

/**
 * Normalize whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  return (
    text
      // Replace tabs with spaces
      .replace(/\t/g, ' ')
      // Collapse multiple spaces to single
      .replace(/ {2,}/g, ' ')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove trailing whitespace from lines
      .replace(/[ \t]+$/gm, '')
      // Remove leading whitespace from lines (but preserve indentation structure)
      .replace(/^[ \t]+/gm, (match) => (match.length > 4 ? '    ' : ''))
      // Collapse more than 2 consecutive newlines to 2
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Fix common OCR character substitutions
 */
export function fixOcrSubstitutions(text: string): string {
  let result = text;
  for (const [pattern, replacement] of OCR_SUBSTITUTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Remove page numbers, headers, and other noise
 */
export function removePageNoise(text: string): string {
  let result = text;
  for (const pattern of PAGE_NOISE_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Join hyphenated words that were broken across lines
 * Example: "ques-\ntion" -> "question"
 */
export function joinBrokenWords(text: string): string {
  // Match word ending with hyphen followed by newline and lowercase continuation
  return text.replace(/(\w+)-\n([a-z])/g, '$1$2');
}

/**
 * Detect and remove repeated header/footer text
 * (text that appears identically on multiple "pages")
 */
export function removeRepeatedHeaders(text: string): string {
  const lines = text.split('\n');
  const lineFrequency = new Map<string, number>();

  // Count line occurrences
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 5 && trimmed.length < 100) {
      lineFrequency.set(trimmed, (lineFrequency.get(trimmed) ?? 0) + 1);
    }
  }

  // Lines appearing 3+ times are likely headers/footers
  const repeatedLines = new Set<string>();
  for (const [line, count] of lineFrequency) {
    if (count >= 3) {
      repeatedLines.add(line);
    }
  }

  // Filter out repeated lines
  if (repeatedLines.size > 0) {
    return lines.filter((line) => !repeatedLines.has(line.trim())).join('\n');
  }

  return text;
}

/**
 * Preprocess OCR text for question parsing
 * Applies all cleanup steps in optimal order
 */
export function preprocessOcrText(text: string): string {
  let result = text;

  // Step 1: Normalize whitespace first
  result = normalizeWhitespace(result);

  // Step 2: Join broken words before other processing
  result = joinBrokenWords(result);

  // Step 3: Fix OCR character substitutions
  result = fixOcrSubstitutions(result);

  // Step 4: Remove page noise
  result = removePageNoise(result);

  // Step 5: Remove repeated headers/footers
  result = removeRepeatedHeaders(result);

  // Step 6: Final whitespace cleanup
  result = normalizeWhitespace(result);

  return result;
}

/**
 * Split text into potential question blocks
 * Uses multiple heuristics to find question boundaries
 */
export function splitIntoBlocks(text: string): string[] {
  const blocks: string[] = [];
  const lines = text.split('\n');
  let currentBlock = '';

  // Patterns that indicate start of a new question
  const questionStartPatterns = [
    /^\d+[\.\)\-:]\s/, // 1. / 1) / 1- / 1:
    /^\(\d+\)\s/, // (1)
    /^[Qq](?:uestion)?\s*\d+/i, // Q1 / Question 1
    /^#\d+\s/, // #1
    /^\[\d+\]\s/, // [1]
  ];

  const isQuestionStart = (line: string): boolean => {
    const trimmed = line.trim();
    return questionStartPatterns.some((pattern) => pattern.test(trimmed));
  };

  for (const line of lines) {
    if (isQuestionStart(line) && currentBlock.trim()) {
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

  return blocks;
}
