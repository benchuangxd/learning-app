/**
 * PDF page extraction using pdf.js
 * Converts PDF pages to images for OCR processing
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker path for Next.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PdfPage {
  pageNumber: number;
  imageData: ImageData;
}

export interface ExtractPagesOptions {
  maxPages?: number;
  onProgress?: (currentPage: number, totalPages: number) => void;
}

/**
 * Extract pages from PDF as ImageData for OCR
 * @param file - PDF file to extract
 * @param options - Extraction options
 * @returns Array of page images
 */
export async function extractPagesFromPdf(
  file: File,
  options: ExtractPagesOptions = {}
): Promise<PdfPage[]> {
  const { maxPages = 20, onProgress } = options;

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Load PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  console.log(`PDF extracted: ${numPages} pages`);

  // Enforce page limit
  if (numPages > maxPages) {
    throw new Error(`PDF exceeds ${maxPages}-page limit. This PDF has ${numPages} pages.`);
  }

  const pages: PdfPage[] = [];

  // Extract each page
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, numPages);
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better OCR

    // Create canvas to render page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    // Get image data from canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    pages.push({
      pageNumber: pageNum,
      imageData,
    });

    // Clean up
    page.cleanup();
  }

  return pages;
}
