export interface KeywordStyle {
  start: number;
  end: number;
  text: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface TextRange {
  start: number;
  end: number;
}

export interface ParsedKeyword {
  text: string;
  start: number;
  end: number;
  type: 'keyword' | 'function' | 'variable' | 'string' | 'number' | 'comment' | 'operator' | 'punctuation' | 'plain';
}

export type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

export type ExportFormat = 'png' | 'svg';
