'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseQuestions, type ParseResult } from '@/lib/parsers/question-parser';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';
import type { Question } from '@/types/question';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

export function QuestionImport(): React.ReactElement {
  const [input, setInput] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  const handleParse = (): void => {
    if (!input.trim()) {
      setParseResult({
        questions: [],
        errors: [{ line: 0, message: 'Please enter some questions to parse' }],
      });
      return;
    }

    setIsProcessing(true);
    setImportSuccess(false);

    // Simulate async processing (parsing is actually sync)
    setTimeout(() => {
      const result = parseQuestions(input);
      setParseResult(result);
      setIsProcessing(false);
    }, 500);
  };

  const handleImport = (): void => {
    if (!parseResult || parseResult.questions.length === 0) {
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Load existing questions
      const existingQuestions = questionsStorage.get() ?? [];

      // Merge with new questions
      const allQuestions = [...existingQuestions, ...parseResult.questions];

      // Save to localStorage
      const success = questionsStorage.set(allQuestions);

      if (success) {
        setImportSuccess(true);
        setInput('');
        setParseResult(null);
      } else {
        setParseResult({
          ...parseResult,
          errors: [
            ...parseResult.errors,
            { line: 0, message: 'Failed to save questions. Storage quota may be exceeded.' },
          ],
        });
      }

      setIsProcessing(false);
    }, 300);
  };

  const handleClear = (): void => {
    setInput('');
    setParseResult(null);
    setImportSuccess(false);
  };

  const hasErrors = parseResult && parseResult.errors.length > 0;
  const hasQuestions = parseResult && parseResult.questions.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Questions</CardTitle>
          <CardDescription>
            Paste your questions in the markdown format below. Each question should include choices
            (A-D or more) with one or more marked as correct using ✅.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example Format */}
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-semibold mb-2">Example Format:</p>
            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
              {`**Question 1 (1 point)**
Which of the following best defines an Embedded System?
A. A system that only uses analogue electronics.
B. A general-purpose computer for various tasks.
C. A standalone software application.
D. A computing system dedicated to a specific task. ✅
— Embedded systems are specialized computing systems.

**Question 2 (2 points)** - Multiple correct answers
Select all programming languages that are statically typed:
A. JavaScript
B. TypeScript ✅
C. Python
D. Java ✅
— TypeScript and Java use static typing, while JavaScript and Python use dynamic typing.`}
            </pre>
          </div>

          {/* Textarea Input */}
          <div>
            <label htmlFor="questions-input" className="text-sm font-medium block mb-2">
              Paste Questions Here
            </label>
            <Textarea
              id="questions-input"
              placeholder="Paste your questions in markdown format..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              disabled={isProcessing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={isProcessing || !input.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Parse Questions'
              )}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={isProcessing}>
              Clear
            </Button>
          </div>

          {/* Success Message */}
          {importSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success!</AlertTitle>
              <AlertDescription className="text-green-600">
                Questions imported successfully. Check your question list below.
              </AlertDescription>
            </Alert>
          )}

          {/* Parse Results */}
          {parseResult && !importSuccess && (
            <div className="space-y-4">
              {/* Errors */}
              {hasErrors && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Parsing Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {parseResult.errors.map((error, idx) => (
                        <li key={idx} className="text-sm">
                          Line {error.line}: {error.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Successfully Parsed Questions */}
              {hasQuestions && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Parsed {parseResult.questions.length} Question
                        {parseResult.questions.length !== 1 ? 's' : ''}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Review and import to your question bank
                      </p>
                    </div>
                    <Button onClick={handleImport} disabled={isProcessing}>
                      Import {parseResult.questions.length} Question
                      {parseResult.questions.length !== 1 ? 's' : ''}
                    </Button>
                  </div>

                  {/* Question Preview */}
                  <div className="space-y-2">
                    {parseResult.questions.map((question, idx) => (
                      <Card key={question.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium flex-1">
                                Question {idx + 1}: {question.text}
                              </p>
                              <div className="flex gap-1 shrink-0">
                                <Badge variant="outline">{question.points} pt</Badge>
                                {question.choices.filter((c) => c.isCorrect).length > 1 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Multi
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              {question.choices.map((choice) => (
                                <div
                                  key={choice.id}
                                  className={choice.isCorrect ? 'font-semibold text-green-600' : ''}
                                >
                                  {choice.label}. {choice.text}
                                  {choice.isCorrect && ' ✅'}
                                </div>
                              ))}
                            </div>
                            {question.explanation && (
                              <p className="text-xs text-muted-foreground italic">
                                → {question.explanation}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
