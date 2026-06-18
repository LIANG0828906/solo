export interface Track {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  height: number;
  auxSend: number;
  color: string;
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
  cursorX: number;
  cursorY: number;
  isActive: boolean;
  activeElement?: string;
  lastBlinkTime: number;
}

export type ToolMode = 'select' | 'draw' | 'erase';

export interface NotePreview {
  trackId: string;
  pitch: number;
  start: number;
  duration: number;
}
