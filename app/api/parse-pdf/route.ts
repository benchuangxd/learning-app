import { NextRequest, NextResponse } from 'next/server';
import { PdfReader } from 'pdfreader';
import { parseQuestions } from '@/lib/parsers/question-parser';
import type { Question } from '@/types/question';

interface ParsePDFResponse {
  success: boolean;
  questions: Question[];
  questionsNeedingExplanation: number[];
  errors: string[];
  warnings: string[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest): Promise<NextResponse<ParsePDFResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validation
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          questionsNeedingExplanation: [],
          errors: ['No file provided'],
          warnings: [],
        },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          questionsNeedingExplanation: [],
          errors: ['File must be a PDF'],
          warnings: [],
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          questionsNeedingExplanation: [],
          errors: ['File too large (max 10MB)'],
          warnings: [],
        },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPDF(buffer);

    if (!text.trim()) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          questionsNeedingExplanation: [],
          errors: ['Could not extract text. PDF may be image-based or protected.'],
          warnings: [],
        },
        { status: 422 }
      );
    }

    // Parse questions using existing parser
    const { questions, errors } = parseQuestions(text);

    if (questions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          questionsNeedingExplanation: [],
          errors:
            errors.length > 0
              ? errors.map((e) => e.message)
              : ['No questions found in expected format'],
          warnings: [],
        },
        { status: 422 }
      );
    }

    // Identify questions needing explanations (no explanation or very short)
    const questionsNeedingExplanation = questions
      .map((q, i) => (!q.explanation || q.explanation.trim().length < 10 ? i : -1))
      .filter((i) => i !== -1);

    const warnings: string[] = [];
    if (errors.length > 0) {
      warnings.push(`${errors.length} question(s) had parsing issues`);
    }

    return NextResponse.json({
      success: true,
      questions,
      questionsNeedingExplanation,
      errors: [],
      warnings,
    });
  } catch (error) {
    console.error('PDF parse error:', error);
    return NextResponse.json(
      {
        success: false,
        questions: [],
        questionsNeedingExplanation: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
      },
      { status: 500 }
    );
  }
}

/**
 * Extract text content from PDF buffer using pdfreader
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const textItems: string[] = [];
    let currentY: number | null = null;

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(new Error(`PDF parsing failed: ${err}`));
        return;
      }

      if (!item) {
        // End of file
        resolve(textItems.join(''));
        return;
      }

      if (item.text) {
        // Add newline when Y position changes significantly (new line)
        if (currentY !== null && item.y !== undefined && Math.abs(item.y - currentY) > 0.3) {
          textItems.push('\n');
        }
        textItems.push(item.text);
        currentY = item.y ?? currentY;
      }

      if (item.page) {
        // New page - add paragraph break
        textItems.push('\n\n');
        currentY = null;
      }
    });
  });
}
