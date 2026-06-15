export interface CellData {
  id: string;
  text: string;
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
  isMerged: boolean;
  isHidden: boolean;
  style?: {
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
  };
}

export interface TableData {
  id: string;
  pageNumber: number;
  rows: CellData[][];
  rowCount: number;
  colCount: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  confidence: number;
  isEdited: boolean;
}

export interface PageData {
  pageNumber: number;
  thumbnail: string;
  tables: TableData[];
  textContent: string;
}

export interface PdfDocument {
  id: string;
  name: string;
  size: number;
  totalPages: number;
  pages: Map<number, PageData>;
  currentPage: number;
}

export interface ExportRequest {
  documentName: string;
  mergeAllPages: boolean;
  selectedPages: number[];
  tables: {
    pageNumber: number;
    tableIndex: number;
    data: TableData;
  }[];
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

export interface WorkerMessage {
  type: 'PARSE_PDF' | 'PARSE_PAGE' | 'CANCEL' | 'PROGRESS';
  data?: unknown;
}

export interface WorkerResult {
  type: 'PAGE_PARSED' | 'PARSE_COMPLETE' | 'PARSE_ERROR' | 'PROGRESS';
  data: unknown;
}

export interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

export interface ParsePageResult {
  pageNumber: number;
  thumbnail: string;
  textItems: TextItem[];
  textContent: string;
  pageWidth: number;
  pageHeight: number;
}
