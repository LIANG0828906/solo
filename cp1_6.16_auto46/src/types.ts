export interface User {
  id: string;
  nickname: string;
  color: string;
}

export interface Note {
  id: string;
  pitch: string;
  duration: string;
  octave: number;
  measure: number;
  position: number;
}

export interface Annotation {
  id: string;
  noteId: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  type: 'comment' | 'highlight' | 'dynamic' | 'error';
  timestamp: number;
  measure: number;
}

export interface SheetMusic {
  id: string;
  name: string;
  spaceId: string;
  notes: Note[];
  annotations: Annotation[];
  createdAt: number;
  updatedAt: number;
}

export interface FamilySpace {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  sheets: SheetMusic[];
}

export interface CollabMessage {
  type: 'note_update' | 'annotation_add' | 'annotation_delete' | 'cursor_update';
  userId: string;
  userName: string;
  userColor: string;
  payload: unknown;
  timestamp: number;
}

export const NOTE_DURATIONS = ['w', 'h', 'q', '8', '16'] as const;
export type NoteDuration = typeof NOTE_DURATIONS[number];

export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type PitchClass = typeof PITCH_CLASSES[number];

export const DYNAMIC_MARKS = ['pp', 'p', 'mp', 'mf', 'f', 'ff'] as const;
export type DynamicMark = typeof DYNAMIC_MARKS[number];
