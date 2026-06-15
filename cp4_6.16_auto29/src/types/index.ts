export interface Project {
  id: string;
  name: string;
  yarnColor: string;
  stitchCount: number;
  rowCount: number;
  referenceImage?: string;
  patternText: string;
  currentRow: number;
  createdAt: number;
  updatedAt: number;
  startTime?: number;
  elapsedSeconds: number;
  undoStack: number[];
}

export interface PatternRow {
  index: number;
  symbols: string[];
}
