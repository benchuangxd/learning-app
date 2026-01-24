'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Question } from '@/types/question';

interface PDFImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (questions: Question[]) => void;
}

type ImportPhase = 'idle' | 'extracting' | 'generating' | 'complete' | 'error';

interface ParsePDFResponse {
  success: boolean;
  questions: Question[];
  questionsNeedingExplanation: number[];
  errors: string[];
  warnings: string[];
}

export function PDFImportDialog({
  open,
  onOpenChange,
  onImport,
}: PDFImportDialogProps): React.ReactElement {
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = (): void => {
    setPhase('idle');
    setProgress(0);
    setStatusMessage('');
    setQuestions([]);
    setErrors([]);
    setWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Phase 1: Extract & Parse
      setPhase('extracting');
      setStatusMessage('Extracting text from PDF...');
      setProgress(10);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as ParsePDFResponse;

      if (!result.success || result.questions.length === 0) {
        setPhase('error');
        setErrors(result.errors.length > 0 ? result.errors : ['No questions found in PDF']);
        return;
      }

      setProgress(50);
      setStatusMessage(`Found ${result.questions.length} question(s)`);
      setWarnings(result.warnings);

      // Phase 2: Generate AI explanations if needed
      if (result.questionsNeedingExplanation.length > 0) {
        setPhase('generating');
        const updatedQuestions = await generateExplanations(
          result.questions,
          result.questionsNeedingExplanation,
          (current, total) => {
            setProgress(50 + (current / total) * 45);
            setStatusMessage(`Generating explanation ${current}/${total}...`);
          }
        );
        setQuestions(updatedQuestions.questions);
        if (updatedQuestions.errors.length > 0) {
          setWarnings((prev) => [...prev, ...updatedQuestions.errors]);
        }
      } else {
        setQuestions(result.questions);
      }

      setPhase('complete');
      setProgress(100);
      setStatusMessage('Import ready!');
    } catch (error) {
      setPhase('error');
      setErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
    }
  };

  const handleConfirmImport = (): void => {
    onImport(questions);
    onOpenChange(false);
    resetState();
  };

  const handleClose = (): void => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import from PDF
          </DialogTitle>
          <DialogDescription>
            Upload a PDF file containing questions. Numeric choices (1, 2, 3, 4) will be converted to
            A, B, C, D.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {phase === 'idle' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click to select a PDF file or drag and drop
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported format: Questions with A/B/C/D or 1/2/3/4 choices, ✅ for correct answers,
                — for explanations
              </p>
            </div>
          )}

          {(phase === 'extracting' || phase === 'generating') && (
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">{statusMessage}</p>
            </div>
          )}

          {phase === 'complete' && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Successfully parsed {questions.length} question
                  {questions.length !== 1 ? 's' : ''}.
                  {warnings.length > 0 && (
                    <span className="block mt-1 text-yellow-600">
                      {warnings.length} warning(s) - some explanations may be missing
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {warnings.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Show warnings ({warnings.length})
                  </summary>
                  <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside">
                    {warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmImport}>
                  Import {questions.length} Question{questions.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">Import failed</p>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={resetState}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generate AI explanations for questions that need them
 */
async function generateExplanations(
  questions: Question[],
  indices: number[],
  onProgress: (current: number, total: number) => void
): Promise<{ questions: Question[]; errors: string[] }> {
  const updatedQuestions = [...questions];
  const errors: string[] = [];

  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i];
    if (idx === undefined) continue;

    const question = updatedQuestions[idx];
    if (!question) continue;

    onProgress(i + 1, indices.length);

    try {
      const response = await fetch('/api/generate-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.text,
          choices: question.choices.map((c) => ({
            label: c.label,
            text: c.text,
            isCorrect: c.isCorrect,
          })),
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { explanation: string };
        updatedQuestions[idx] = {
          ...question,
          explanation: `[AI Generated] ${data.explanation}`,
        };
      } else {
        errors.push(`Question ${idx + 1}: Failed to generate explanation`);
      }
    } catch {
      errors.push(`Question ${idx + 1}: Network error`);
    }

    // Small delay to avoid rate limiting
    if (i < indices.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { questions: updatedQuestions, errors };
}
