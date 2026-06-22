export interface Note {
  id: string;
  pitch: number;
  startBeat: number;
  duration: number;
  voiceId: string;
  measureId: string;
}

export interface Voice {
  id: string;
  name: string;
  color: string;
}

export interface Measure {
  id: string;
  number: number;
  voiceIds: string[];
  notes: Note[];
}

export interface Score {
  id: string;
  title: string;
  bpm: number;
  voices: Voice[];
  measures: Measure[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  scoreId: string;
  voiceId: string;
  noteId: string;
  parentId: string | null;
  text: string;
  author: string;
  x: number;
  y: number;
  read: boolean;
  createdAt: string;
}

export type ViewMode = 'staff' | 'pianoRoll';
