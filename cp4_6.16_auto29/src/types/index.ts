export interface ActiveTimeSegment {
  startTime: number;
  endTime?: number;
}

export interface ProjectSnapshot {
  name: string;
  yarnColor: string;
  stitchCount: number;
  rowCount: number;
  referenceImage?: string;
  patternText: string;
  currentRow: number;
  elapsedSeconds: number;
  activeSegments: ActiveTimeSegment[];
}

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
  activeSegments: ActiveTimeSegment[];
  undoStack: ProjectSnapshot[];
}

export interface PatternRow {
  index: number;
  symbols: string[];
}

export interface PatternValidationResult {
  valid: boolean;
  rowCount: number;
  stitchCount: number;
  inconsistentRows: { rowIndex: number; length: number }[];
  error?: string;
}
