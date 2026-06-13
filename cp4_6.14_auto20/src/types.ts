export interface Note {
  id: string;
  pitch: number;
  octave: number;
  duration: number;
  position: number;
  staff: 'treble' | 'bass';
  accidental?: 'sharp' | 'flat' | 'natural';
}

export interface Score {
  id: string;
  title: string;
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  notes: Note[];
  createdAt: number;
  updatedAt: number;
}

export interface VersionSnapshot {
  id: string;
  scoreId: string;
  score: Score;
  timestamp: number;
  author: string;
  message?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursorPosition: number | null;
}

export type EditorAction =
  | { type: 'ADD_NOTE'; note: Note; userId: string }
  | { type: 'DELETE_NOTE'; noteId: string; userId: string }
  | { type: 'MOVE_NOTE'; noteId: string; newPosition: number; newPitch: number; userId: string }
  | { type: 'CURSOR_UPDATE'; userId: string; position: number | null };

export interface ExportProgress {
  type: 'midi' | 'svg';
  progress: number;
  done: boolean;
}
