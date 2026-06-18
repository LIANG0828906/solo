export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  bounds: BoundingBox;
  isError?: boolean;
  errorBlinkPhase?: number;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface CharacterSegment {
  id: string;
  strokes: Stroke[];
  bounds: BoundingBox;
  char?: string;
  candidates?: Candidate[];
  selectedCandidate?: number;
  confidence: number;
}

export interface Candidate {
  char: string;
  confidence: number;
}

export interface HistoryState {
  text: string;
  cursor: number;
  segments: CharacterSegment[];
}

export type EditorAction =
  | { type: 'insert'; char: string; position: number }
  | { type: 'delete'; position: number; char: string }
  | { type: 'replace'; position: number; oldChar: string; newChar: string }
  | { type: 'clear' }
  | { type: 'batch'; actions: EditorAction[] };
