export type Language = 'javascript' | 'python' | 'html' | 'css';

export interface CodeVersion {
  id: string;
  code: string;
  language: Language;
  timestamp: number;
  lineCount: number;
}

export type DiffLineType = 'added' | 'removed' | 'unchanged';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  lineNumber: number;
  oldLineNumber?: number;
}

export interface DiffBlock {
  startLine: number;
  lines: DiffLine[];
}
