'use client';

import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

export type ProgressCallback = (message: string) => void;

export interface PDFExtractionResult {
  text: string;
  numPages: number;
  usedOCR: boolean;
}

export interface PDFExtractionOptions {
  forceOCR?: boolean;
}

function isTextItem(item: unknown): item is TextItem {
  return (
    item !== null &&
    typeof item === 'object' &&
    'str' in item &&
    typeof (item as TextItem).str === 'string' &&
    'transform' in item &&
    Array.isArray((item as TextItem).transform)
  );
}

function detectMultiColumnInterleaving(text: string): boolean {
  const multiHeaderLine = /Question\s+\d+[^Q]*Question\s+\d+/i.test(text);

  const lines = text.split('\n');
  let multipleOptionsOnLine = 0;
  for (const line of lines) {
    const optionMatches = line.match(/[A-E]\./g);
    if (optionMatches && optionMatches.length > 1) {
      multipleOptionsOnLine++;
    }
  }

  const frequentMerges = (text.match(/[a-z][A-Z][a-z]/g) || []).length > 10;

  return multiHeaderLine || multipleOptionsOnLine > 2 || frequentMerges;
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: ProgressCallback,
  options?: PDFExtractionOptions
): Promise<PDFExtractionResult> {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    onProgress?.(`Loaded PDF (${pdfDocument.numPages} pages)`);

    if (options?.forceOCR) {
      onProgress?.('Using OCR mode...');
      const text = await extractTextWithOCR(pdfDocument, onProgress);
      return { text, numPages: pdfDocument.numPages, usedOCR: true };
    }

    const needsOCR = await checkIfNeedsOCR(pdfDocument);

    if (needsOCR) {
      onProgress?.('Scanned PDF detected - using OCR...');
      const text = await extractTextWithOCR(pdfDocument, onProgress);
      return { text, numPages: pdfDocument.numPages, usedOCR: true };
    }

    onProgress?.('Extracting text...');
    const directText = await extractTextDirect(pdfDocument, onProgress);

    if (detectMultiColumnInterleaving(directText)) {
      onProgress?.('Multi-column layout detected - switching to OCR for better results...');
      const ocrText = await extractTextWithOCR(pdfDocument, onProgress);
      return { text: ocrText, numPages: pdfDocument.numPages, usedOCR: true };
    }

    return { text: directText, numPages: pdfDocument.numPages, usedOCR: false };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function checkIfNeedsOCR(pdfDocument: PDFDocumentProxy): Promise<boolean> {
  const page = await pdfDocument.getPage(1);
  const textContent = await page.getTextContent();

  if (textContent.items.length === 0) return true;

  const hasRealText = textContent.items.some(
    (item) => isTextItem(item) && item.str.trim().length > 0
  );

  return !hasRealText;
}

async function extractTextDirect(
  pdfDocument: PDFDocumentProxy,
  onProgress?: ProgressCallback
): Promise<string> {
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    const textByLine = new Map<number, TextItem[]>();

    for (const item of textContent.items) {
      if (!isTextItem(item)) continue;

      const y = Math.round(item.transform[5]);
      if (!textByLine.has(y)) {
        textByLine.set(y, []);
      }
      textByLine.get(y)!.push(item);
    }

    const sortedY = Array.from(textByLine.keys()).sort((a, b) => b - a);

    for (const y of sortedY) {
      const lineItems = textByLine.get(y)!;
      lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

      const lineText = lineItems
        .map((item) => item.str)
        .join('')
        .trim();
      if (lineText) {
        fullText += lineText + '\n';
      }
    }

    fullText += '\n';
    onProgress?.(`Extracted page ${pageNum}/${pdfDocument.numPages}`);
  }

  return fullText.trim();
}

async function renderPageToCanvas(page: PDFPageProxy): Promise<Blob> {
  const viewport = page.getViewport({ scale: 2.5 });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  }).promise;

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

async function extractTextWithOCR(
  pdfDocument: PDFDocumentProxy,
  onProgress?: ProgressCallback
): Promise<string> {
  const { createWorker, OEM } = await import('tesseract.js');
  let fullText = '';

  const worker = await createWorker('eng', OEM.LSTM_ONLY);

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    onProgress?.(`OCR processing page ${pageNum}/${pdfDocument.numPages}...`);

    const page = await pdfDocument.getPage(pageNum);
    const blob = await renderPageToCanvas(page);

    const {
      data: { text },
    } = await worker.recognize(blob);

    if (text.trim()) {
      fullText += text.trim() + '\n\n---\n\n';
    }
  }

  await worker.terminate();

  return fullText.trim();
}

export async function extractTextFromPDFWithOCR(
  file: File,
  onProgress?: ProgressCallback
): Promise<PDFExtractionResult> {
  return extractTextFromPDF(file, onProgress, { forceOCR: true });
}

export async function getPDFInfo(file: File): Promise<{ numPages: number }> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  return { numPages: pdfDocument.numPages };
}
