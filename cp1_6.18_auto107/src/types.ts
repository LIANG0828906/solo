export interface CodePosition {
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}

export type Severity = 'critical' | 'medium' | 'low';

export interface BadSmell {
  id: string;
  type: string;
  name: string;
  severity: Severity;
  description: string;
  suggestion: string;
  position: CodePosition;
  snippet: string;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'error';

export interface AnalysisResult {
  status: AnalysisStatus;
  progress: number;
  badSmells: BadSmell[];
  error?: string;
}
