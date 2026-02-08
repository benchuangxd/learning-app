/**
 * Tesseract.js OCR service
 * Extracts text from images using Tesseract OCR engine
 */

import type { PdfPage } from './pdf-extractor';

export interface OcrOptions {
  onProgress?: (currentPage: number, totalPages: number) => void;
}

export interface OcrResult {
  text: string;
  pageCount: number;
}

/**
 * Extract text from PDF pages using Tesseract OCR
 * @param pages - Array of page images from PDF
 * @param options - OCR options
 * @returns Extracted text concatenated from all pages
 */
export async function extractTextFromPages(
  pages: PdfPage[],
  options: OcrOptions = {}
): Promise<OcrResult> {
  const { onProgress } = options;

  // Dynamically import Tesseract.js (lazy loading)
  const Tesseract = await import('tesseract.js');

  // Create Tesseract worker
  const worker = await Tesseract.createWorker('eng', 1, {
    // Language data will be fetched from CDN (unpkg.com)
    // This is acceptable for privacy model - only language packs are fetched,
    // user's PDF data never leaves the browser
  });

  const extractedTexts: string[] = [];

  try {
    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      if (!page) continue;

      if (onProgress) {
        onProgress(i + 1, pages.length);
      }

      const canvas = document.createElement('canvas');
      canvas.width = page.imageData.width;
      canvas.height = page.imageData.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(page.imageData, 0, 0);
      }

      const result = await worker.recognize(canvas);
      extractedTexts.push(result.data.text);

      console.log(`OCR page ${page.pageNumber}: ${result.data.text.length} characters`);
    }
  } finally {
    // Always terminate worker to free resources
    await worker.terminate();
  }

  // Concatenate all page texts with newline separators
  const fullText = extractedTexts.join('\n\n');

  console.log(`OCR complete: extracted ${fullText.length} characters from ${pages.length} pages`);

  return {
    text: fullText,
    pageCount: pages.length,
  };
}

/**
 * Extract text from PDF file (convenience function)
 * Combines PDF extraction and OCR in one call
 */
export async function extractTextFromPdf(
  file: File,
  options: {
    maxPages?: number;
    onProgress?: (stage: string, current: number, total: number) => void;
  } = {}
): Promise<string> {
  const { maxPages = 20, onProgress } = options;

  // Import PDF extractor
  const { extractPagesFromPdf } = await import('./pdf-extractor');

  // Extract pages from PDF
  if (onProgress) {
    onProgress('Extracting pages', 0, 1);
  }

  const pages = await extractPagesFromPdf(file, {
    maxPages,
    onProgress: (current, total) => {
      if (onProgress) {
        onProgress('Extracting images', current, total);
      }
    },
  });

  // Run OCR on pages
  if (onProgress) {
    onProgress('Running OCR', 0, pages.length);
  }

  const result = await extractTextFromPages(pages, {
    onProgress: (current, total) => {
      if (onProgress) {
        onProgress('Running OCR', current, total);
      }
    },
  });

  return result.text;
}
