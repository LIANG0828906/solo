export interface Point {
  x: number;
  y: number;
}

export type ToolType = 'pen' | 'rectangle' | 'circle';

export interface DrawingPath {
  id: string;
  type: ToolType;
  points: Point[];
  color: string;
  lineWidth: number;
}

export interface NoteData {
  id: string;
  x: number;
  y: number;
  content: string;
  color: NoteColor;
}

export type NoteColor = 'red' | 'yellow' | 'blue' | 'green';

export const NOTE_COLORS: Record<NoteColor, string> = {
  red: '#ff6b6b',
  yellow: '#ffd93d',
  blue: '#6bcbff',
  green: '#6bff8e',
};

export type ActionType = 'draw' | 'add_note' | 'update_note' | 'delete_note' | 'clear';

export interface HistoryState {
  drawings: DrawingPath[];
  notes: NoteData[];
}

export interface WebSocketMessage {
  type: 'draw' | 'draw_batch' | 'add_note' | 'update_note' | 'delete_note' | 'clear' | 'init' | 'user_count' | 'undo_redo_state';
  data?: any;
  drawings?: DrawingPath[];
  notes?: NoteData[];
  userCount?: number;
}
