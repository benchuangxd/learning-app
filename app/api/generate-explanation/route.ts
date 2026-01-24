import { NextRequest, NextResponse } from 'next/server';

interface GenerateExplanationRequest {
  question: string;
  choices: { label: string; text: string; isCorrect: boolean }[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

const MAX_RETRIES = 3;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body = (await request.json()) as GenerateExplanationRequest;
    const { question, choices } = body;

    if (!question || !choices) {
      return NextResponse.json({ error: 'Missing question or choices' }, { status: 400 });
    }

    const correctAnswers = choices
      .filter((c) => c.isCorrect)
      .map((c) => `${c.label}. ${c.text}`)
      .join(', ');

    const choicesText = choices.map((c) => `${c.label}. ${c.text}`).join('\n');

    const prompt = `Generate a brief explanation (2-3 sentences) for why the correct answer is right for this question.

Question: ${question}

Choices:
${choicesText}

Correct Answer(s): ${correctAnswers}

Provide only the explanation, no preamble.`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 256,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = (await response.json()) as GeminiResponse;

        if (data.error) {
          throw new Error(data.error.message);
        }

        const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!explanation) {
          throw new Error('No explanation generated');
        }

        return NextResponse.json({ explanation });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    return NextResponse.json(
      { error: `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}` },
      { status: 500 }
    );
  } catch (error) {
    console.error('Generate explanation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
