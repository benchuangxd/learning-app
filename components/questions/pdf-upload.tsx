'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  parseOcrText,
  toggleCorrectAnswer,
  hasCorrectAnswer,
} from '@/lib/parsers/ocr-question-parser';
import type { Question } from '@/types/question';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

export function PdfUpload(): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [editableQuestions, setEditableQuestions] = useState<Question[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await handleFile(droppedFile);
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFile(selectedFile);
    }
    e.target.value = '';
  };

  const handleFile = async (uploadedFile: File): Promise<void> => {
    if (uploadedFile.type !== 'application/pdf') {
      setError('Invalid file type. Please upload a PDF.');
      return;
    }

    setError(null);
    setFile(uploadedFile);
    setIsProcessing(true);
    setProgress('Initializing...');
    setEditableQuestions([]);
    setImportSuccess(false);

    try {
      const { extractTextFromPdf } = await import('@/lib/ocr/tesseract-service');

      const extractedText = await extractTextFromPdf(uploadedFile, {
        maxPages: 40,
        onProgress: (stage, current, total) => {
          setProgress(`${stage}: ${current} of ${total}`);
        },
      });

      setProgress('Parsing questions...');
      const result = parseOcrText(extractedText);
      setEditableQuestions(result.questions);

      if (result.questions.length === 0) {
        setError(
          'No questions detected. The PDF may not contain recognizable question patterns (e.g., "1.", "A.", etc.).'
        );
      }

      setIsProcessing(false);
      setProgress('');
    } catch (err) {
      console.error('OCR processing failed:', err);

      if (err instanceof Error) {
        if (err.message.includes('exceeds')) {
          setError(err.message);
        } else {
          setError('Failed to process PDF. Please try another file.');
        }
      } else {
        setError('Failed to process PDF. Please try another file.');
      }

      setIsProcessing(false);
      setProgress('');
      setEditableQuestions([]);
    }
  };

  const handleToggleCorrect = (questionIndex: number, choiceId: string): void => {
    setEditableQuestions((prev) => {
      const updated = [...prev];
      const question = updated[questionIndex];
      if (question) {
        updated[questionIndex] = toggleCorrectAnswer(question, choiceId);
      }
      return updated;
    });
  };

  const handleImport = (): void => {
    if (editableQuestions.length === 0) {
      return;
    }

    const questionsWithAnswers = editableQuestions.filter(hasCorrectAnswer);

    if (questionsWithAnswers.length === 0) {
      setError('Please mark at least one correct answer for each question before importing.');
      return;
    }

    if (questionsWithAnswers.length < editableQuestions.length) {
      const missing = editableQuestions.length - questionsWithAnswers.length;
      setError(
        `${missing} question(s) have no correct answer marked. Please mark correct answers or remove them.`
      );
      return;
    }

    const existingQuestions = questionsStorage.get() ?? [];
    const allQuestions = [...existingQuestions, ...questionsWithAnswers];
    const success = questionsStorage.set(allQuestions);

    if (success) {
      setImportSuccess(true);
      setEditableQuestions([]);
      setFile(null);

      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
      }, 100);
    } else {
      setError('Storage quota exceeded. Please export and delete some questions.');
    }
  };

  const handleRemoveQuestion = (index: number): void => {
    setEditableQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFile = (): void => {
    setFile(null);
    setError(null);
    setIsProcessing(false);
    setProgress('');
    setEditableQuestions([]);
    setImportSuccess(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const questionsWithoutAnswers = editableQuestions.filter((q) => !hasCorrectAnswer(q)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload PDF</CardTitle>
        <CardDescription>
          Upload a scanned PDF to extract questions. Click choices to mark correct answers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:bg-muted/50',
              isDragging ? 'border-primary bg-muted/50' : 'border-muted-foreground/25',
              error ? 'border-destructive/50 bg-destructive/5' : ''
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Drag & drop PDF here or click to browse</p>
              <p className="text-xs">Supports scanned exam PDFs (max 40 pages)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-background p-2 rounded-md border">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isProcessing ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{progress || 'Processing...'}</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                )}
              </div>
            </div>

            {editableQuestions.length > 0 && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Questions Extracted</AlertTitle>
                  <AlertDescription>
                    Found {editableQuestions.length} question
                    {editableQuestions.length !== 1 ? 's' : ''}. Click on choices to mark correct
                    answers.
                    {questionsWithoutAnswers > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 ml-1">
                        ({questionsWithoutAnswers} need answers)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="max-h-96 overflow-y-auto space-y-4 border rounded-lg p-4">
                  {editableQuestions.map((question, qIdx) => (
                    <div key={question.id} className="space-y-2 pb-4 border-b last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Q{qIdx + 1}</Badge>
                          {!hasCorrectAnswer(question) && (
                            <Badge variant="destructive" className="text-xs">
                              No answer
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveQuestion(qIdx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-medium text-sm">{question.text}</p>
                      <div className="space-y-1 pl-2">
                        {question.choices.map((choice) => (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => handleToggleCorrect(qIdx, choice.id)}
                            className={cn(
                              'w-full text-left px-2 py-1 rounded text-sm transition-colors',
                              'hover:bg-muted/50 cursor-pointer',
                              choice.isCorrect
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                                : 'text-muted-foreground'
                            )}
                          >
                            {choice.label}. {choice.text}
                            {choice.isCorrect && ' ✓'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleImport}
                  className="w-full"
                  disabled={questionsWithoutAnswers > 0}
                >
                  Import {editableQuestions.length} Question
                  {editableQuestions.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {importSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Questions imported successfully!</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
