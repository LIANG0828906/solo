export interface WoodPiece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  cut: boolean;
}

export interface MarkedLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  angle: number;
  isReal: boolean;
}

export interface MarkingDot {
  id: string;
  x: number;
  y: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  line: MarkedLine;
  markers: MarkingDot[];
  score: 'A' | 'B' | 'C' | 'D';
  thumbnail: string;
}
