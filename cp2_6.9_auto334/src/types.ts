export type Radical = '金' | '木' | '水' | '火' | '土';

export interface Character {
  id: string;
  char: string;
  radical: Radical;
  strokeCount: number;
}

export interface GridCell {
  row: number;
  col: number;
  character: Character | null;
  offsetX: number;
  offsetY: number;
}

export interface PrintRecord {
  id: string;
  timestamp: number;
  inkLevel: number;
  pressure: number;
  gridData: GridCell[][];
  centerOffset: { x: number; y: number };
  inkUniformity: number;
}

export type WorkshopStage = 'typesetting' | 'inking' | 'pressing' | 'revealing';

export interface TypesettingState {
  grid: GridCell[][];
  selectedCell: { row: number; col: number } | null;
  history: GridCell[][][];
  historyIndex: number;
}

export interface WorkshopState {
  stage: WorkshopStage;
  inkLevel: number;
  pressure: number;
  printRecord: PrintRecord | null;
  typesetting: TypesettingState;
}

export const GRID_ROWS = 15;
export const GRID_COLS = 30;
export const CELL_SIZE = 36;
export const MAX_HISTORY = 20;
