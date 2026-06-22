export interface Chord {
  id: string;
  name: string;
  duration: number;
}

export interface LyricBlock {
  id: string;
  content: string;
  measureIndex: number;
  formatting: {
    bold: boolean;
    italic: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  color: string;
  songId: string;
}

export interface Song {
  id: string;
  name: string;
  timeSignature: '4/4' | '3/4';
  bpm: number;
  key: string;
  chordSequence: Chord[][];
  lyricBlocks: LyricBlock[];
  createdAt: number;
  updatedAt: number;
  members: string[];
}

export interface ChordOp {
  measure: number;
  position: number;
  chord?: string;
  timestamp: number;
}

export interface LyricOp {
  blockId: string;
  content: string;
  formatting?: { bold: boolean; italic: boolean };
  timestamp: number;
}

export interface CursorPosition {
  measure: number;
  position: number;
  type: 'lyric' | 'chord';
}

export type ClientMessage =
  | { type: 'join'; songId: string; userId: string; userName: string }
  | { type: 'leave'; songId: string; userId: string }
  | { type: 'chord_add'; songId: string; payload: ChordOp }
  | { type: 'chord_remove'; songId: string; payload: ChordOp }
  | { type: 'lyric_update'; songId: string; payload: LyricOp }
  | { type: 'cursor_move'; songId: string; payload: CursorPosition };

export type ServerMessage =
  | { type: 'user_joined'; user: User }
  | { type: 'user_left'; userId: string }
  | { type: 'chord_added'; payload: ChordOp & { userId: string } }
  | { type: 'chord_removed'; payload: ChordOp & { userId: string } }
  | { type: 'lyric_updated'; payload: LyricOp & { userId: string } }
  | { type: 'cursor_moved'; payload: CursorPosition & { userId: string; userName: string; color: string } };
