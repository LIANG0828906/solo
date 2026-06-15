export interface OCRTextLine {
  text: string;
  confidence: number;
}

export interface OCRFrameResult {
  timestamp: number;
  frameIndex: number;
  lines: OCRTextLine[];
  fullText: string;
}

export interface PDFPageText {
  pageNumber: number;
  textBlocks: string[];
  fullText: string;
}

export type DiffType = 'missing' | 'extra' | 'mismatch' | 'order_mismatch';

export interface DiffItem {
  type: DiffType;
  ocrText?: string;
  pdfText?: string;
  ocrTimestamp?: number;
  pdfPageNumber?: number;
  similarity: number;
}

export interface CompareResult {
  totalOCRFrames: number;
  totalPDFPages: number;
  diffCount: number;
  diffItems: DiffItem[];
  matchedPairs: Array<{
    ocrFrame: OCRFrameResult;
    pdfPage: PDFPageText;
    similarity: number;
  }>;
}

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export interface ProcessingStatus {
  stage: 'idle' | 'extracting' | 'ocr' | 'parsing' | 'comparing' | 'done' | 'error';
  progress: number;
  message: string;
}
