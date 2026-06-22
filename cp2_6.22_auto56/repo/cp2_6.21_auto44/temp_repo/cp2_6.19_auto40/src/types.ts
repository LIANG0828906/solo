export interface Track {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  height: number;
  send: number;
  color: string;
  instrument: string;
}

export interface Note {
  id: string;
  trackId: string;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isOnline: boolean;
}

export interface CollaboratorCursor {
  collaboratorId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  action: 'idle' | 'dragging-note' | 'dragging-fader' | 'drawing';
  targetNoteId?: string;
  targetTrackId?: string;
}

export interface AutomationPoint {
  id: string;
  trackId: string;
  time: number;
  value: number;
}

export type NoteAction =
  | { type: 'ADD'; note: Note }
  | { type: 'REMOVE'; noteId: string }
  | { type: 'MOVE'; noteId: string; start: number; pitch: number; duration: number };

export const GRID_SIZE = 16;
export const BEATS_PER_BAR = 4;
export const BARS = 16;
export const TOTAL_BEATS = BEATS_PER_BAR * BARS;
export const MIN_TRACK_HEIGHT = 60;
export const MAX_TRACK_HEIGHT = 200;
export const MAX_TRACKS = 8;
export const MAX_NOTES_PER_TRACK = 128;
export const MIN_BPM = 60;
export const MAX_BPM = 200;
export const DEFAULT_BPM = 120;
export const PITCH_MIN = 36;
export const PITCH_MAX = 96;
export const TOTAL_PITCHES = PITCH_MAX - PITCH_MIN;
