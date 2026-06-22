export type NoteType = 'whole' | 'half' | 'quarter' | 'eighth';

export interface Note {
  id: string;
  type: NoteType;
  x: number;
  y: number;
  trackId: string;
  measure: number;
  beat: number;
  createdAt: number;
  userId?: string;
  animate?: boolean;
}

export interface Track {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  color: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface RoomState {
  roomId: string;
  notes: Note[];
  tracks: Track[];
  users: User[];
  bpm: number;
}

export interface VersionSnapshot {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  createdAt: number;
  snapshot: {
    notes: Note[];
    tracks: Track[];
    bpm: number;
  };
}

export const NOTE_COLORS: Record<NoteType, string> = {
  whole: '#FF6B6B',
  half: '#4ECDC4',
  quarter: '#45B7D1',
  eighth: '#96CEB4',
};

export const USER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#6C63FF',
  '#FF9F43',
  '#A29BFE',
];

export const NOTE_DURATIONS: Record<NoteType, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
};
