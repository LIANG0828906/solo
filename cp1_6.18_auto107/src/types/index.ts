export type Severity = 'high' | 'medium' | 'low';

export interface BadSmell {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  position: {
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
  };
  codeSnippet: string;
  suggestion: string;
}

export interface AnalysisResult {
  badSmells: BadSmell[];
  totalSmells: number;
  analysisTime?: number;
}

export interface AppState {
  rawCode: string;
  fileName: string;
  analysisResult: AnalysisResult;
  isAnalyzing: boolean;
  progress: number;
  selectedSmellId: string | null;
  expandedSmellIds: Set<string>;
  setRawCode: (code: string, fileName?: string) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setProgress: (progress: number) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  selectSmell: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  reset: () => void;
}
