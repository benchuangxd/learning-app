'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseQuestions, type ParseResult } from '@/lib/parsers/question-parser';
import type { Question } from '@/types/question';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

export function PdfUpload(): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
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
    setParseResult(null);
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
      const result = parseQuestions(extractedText);
      setParseResult(result);

      if (result.questions.length === 0) {
        setError('No questions found. Verify PDF format matches expected structure.');
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
      setParseResult(null);
    }
  };

  const handleImport = (): void => {
    if (!parseResult || parseResult.questions.length === 0) {
      return;
    }

    const existingQuestions = questionsStorage.get() ?? [];
    const allQuestions = [...existingQuestions, ...parseResult.questions];
    const success = questionsStorage.set(allQuestions);

    if (success) {
      setImportSuccess(true);
      setParseResult(null);
      setFile(null);

      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
      }, 100);
    } else {
      setError('Storage quota exceeded. Please export and delete some questions.');
    }
  };

  const removeFile = (): void => {
    setFile(null);
    setError(null);
    setIsProcessing(false);
    setProgress('');
    setParseResult(null);
    setImportSuccess(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload PDF</CardTitle>
        <CardDescription>Upload a PDF file to extract questions automatically.</CardDescription>
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
              <p className="text-xs">Supports .pdf files only (max 40 pages)</p>
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

            {parseResult && parseResult.questions.length > 0 && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Questions Extracted</AlertTitle>
                  <AlertDescription>
                    Found {parseResult.questions.length} question
                    {parseResult.questions.length !== 1 ? 's' : ''} in PDF.
                  </AlertDescription>
                </Alert>

                <div className="max-h-96 overflow-y-auto space-y-4 border rounded-lg p-4">
                  {parseResult.questions.map((question, idx) => (
                    <div key={idx} className="space-y-2 pb-4 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {question.points} point{question.points !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary">{question.difficulty}</Badge>
                      </div>
                      <p className="font-medium">{question.text}</p>
                      <div className="space-y-1 pl-4">
                        {question.choices.map((choice, cidx) => (
                          <div key={cidx} className="flex items-center gap-2 text-sm">
                            <span
                              className={
                                choice.isCorrect ? 'text-green-600 dark:text-green-400' : ''
                              }
                            >
                              {choice.label}. {choice.text}
                              {choice.isCorrect && ' ✅'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={handleImport} className="w-full">
                  Import {parseResult.questions.length} Question
                  {parseResult.questions.length !== 1 ? 's' : ''}
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
