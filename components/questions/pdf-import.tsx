'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { parseQuestions, type ParseResult } from '@/lib/parsers/question-parser';
import { preprocessPDFExtractedText } from '@/lib/parsers/pdf-text-normalizer';
import { extractTextFromPDF, type PDFExtractionResult } from '@/lib/pdf-ocr';
import { LocalStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';
import type { Question } from '@/types/question';
import { AlertCircle, CheckCircle2, Loader2, Folder, FileText, Upload } from 'lucide-react';

const questionsStorage = new LocalStorageAdapter<Question[]>(STORAGE_KEYS.QUESTIONS);

interface PDFImportProps {
  onImportComplete?: () => void;
}

export function PDFImport({ onImportComplete }: PDFImportProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [pdfInfo, setPdfInfo] = useState<PDFExtractionResult | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('');
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = questionsStorage.get();
    if (stored) {
      const categories = [...new Set(stored.map((q) => q.category).filter(Boolean) as string[])];
      setExistingCategories(categories.sort());
    }
  }, []);

  const handleFileSelect = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedText('');
    setParseResult(null);
    setImportSuccess(false);
    setPdfInfo(null);

    try {
      const result = await extractTextFromPDF(file, setProgress);
      setPdfInfo(result);
      setExtractedText(result.text);
      setProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text from PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParse = (): void => {
    if (!extractedText.trim()) {
      setError('No text to parse');
      return;
    }

    setIsProcessing(true);
    setImportSuccess(false);

    setTimeout(() => {
      const normalizedText = preprocessPDFExtractedText(extractedText);

      const result = parseQuestions(normalizedText);

      if (result.questions.length > 0 && category.trim()) {
        result.questions = result.questions.map((q) => ({
          ...q,
          category: category.trim(),
        }));
      }

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
      const existingQuestions = questionsStorage.get() ?? [];
      const allQuestions = [...existingQuestions, ...parseResult.questions];
      const success = questionsStorage.set(allQuestions);

      if (success) {
        setImportSuccess(true);
        setExtractedText('');
        setCategory('');
        setParseResult(null);
        setPdfInfo(null);

        const updatedQuestions = questionsStorage.get();
        if (updatedQuestions) {
          const categories = [
            ...new Set(updatedQuestions.map((q) => q.category).filter(Boolean) as string[]),
          ];
          setExistingCategories(categories.sort());
        }

        onImportComplete?.();
      } else {
        setError('Failed to save questions. Storage quota may be exceeded.');
      }

      setIsProcessing(false);
    }, 300);
  };

  const handleClear = (): void => {
    setExtractedText('');
    setCategory('');
    setParseResult(null);
    setImportSuccess(false);
    setError(null);
    setPdfInfo(null);
    setProgress('');
  };

  const handleClose = (): void => {
    handleClear();
    setIsOpen(false);
  };

  const hasErrors = parseResult && parseResult.errors.length > 0;
  const hasQuestions = parseResult && parseResult.questions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Import PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Questions from PDF</DialogTitle>
          <DialogDescription>
            Upload a PDF file containing questions. The text will be extracted using OCR if needed,
            then parsed into questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {!extractedText && !isProcessing && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={handleFileSelect}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Click to select a PDF file</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports both text-based and scanned PDFs (OCR)
              </p>
            </div>
          )}

          {isProcessing && progress && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{progress}</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {pdfInfo && !parseResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{pdfInfo.numPages} pages</Badge>
                {pdfInfo.usedOCR && <Badge variant="secondary">OCR Used</Badge>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf-category" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Category / Folder (Optional)
                </Label>
                <Input
                  id="pdf-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Math, History, Programming..."
                  list="pdf-categories"
                  disabled={isProcessing}
                />
                <datalist id="pdf-categories">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <Label htmlFor="extracted-text" className="block mb-2">
                  Extracted Text (edit if needed)
                </Label>
                <Textarea
                  id="extracted-text"
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleParse} disabled={isProcessing || !extractedText.trim()}>
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
            </div>
          )}

          {importSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success!</AlertTitle>
              <AlertDescription className="text-green-600">
                Questions imported successfully. You can close this dialog.
              </AlertDescription>
            </Alert>
          )}

          {parseResult && !importSuccess && (
            <div className="space-y-4">
              {hasErrors && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Parsing Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {parseResult.errors.map((err, idx) => (
                        <li key={idx} className="text-sm">
                          Line {err.line}: {err.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

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
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setParseResult(null)}>
                        Edit Text
                      </Button>
                      <Button onClick={handleImport} disabled={isProcessing}>
                        Import {parseResult.questions.length} Question
                        {parseResult.questions.length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {parseResult.questions.map((question, idx) => (
                      <Card key={question.id}>
                        <CardContent className="pt-4">
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

              {!hasQuestions && !hasErrors && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Questions Found</AlertTitle>
                  <AlertDescription>
                    No valid questions could be parsed from the extracted text. Please check the
                    format and try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {(importSuccess || parseResult) && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
