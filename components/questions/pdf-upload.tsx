'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PdfUpload(): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleFile = async (file: File): Promise<void> => {
    if (file.type !== 'application/pdf') {
      setError('Invalid file type. Please upload a PDF.');
      return;
    }

    setError(null);
    setFile(file);
    setIsLoading(true);

    try {
      const Tesseract = await import('tesseract.js');
      console.log('Tesseract loaded:', Tesseract);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load Tesseract:', err);
      setError('Failed to initialize OCR engine.');
      setIsLoading(false);
    }
  };

  const removeFile = (): void => {
    setFile(null);
    setError(null);
    setIsLoading(false);
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
              <p className="text-xs">Supports .pdf files only</p>
            </div>
          </div>
        ) : (
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
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Preparing...</span>
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
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
