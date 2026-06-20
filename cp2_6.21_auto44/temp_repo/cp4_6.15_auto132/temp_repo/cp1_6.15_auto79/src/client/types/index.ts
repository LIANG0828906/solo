export interface Project {
  id: string;
  name: string;
  key: string;
  bpm: number;
  instruments: string[];
  joinCode: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  measure: number;
  beat: number;
  pitch: number;
  duration: number;
  instrument: string;
}

export interface ProjectDetail extends Project {
  notes: Note[];
}

export interface Version {
  id: string;
  projectId: string;
  name: string;
  snapshot: Note[];
  creatorId: string;
  creatorName: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar: string;
  online: boolean;
}

export interface DiffNote {
  note: Note;
  type: 'added' | 'removed';
}

export type InstrumentType = 
  | 'guitar'
  | 'bass'
  | 'drums'
  | 'keyboard'
  | 'vocals'
  | 'violin'
  | 'saxophone'
  | 'trumpet';

export const INSTRUMENTS: { id: InstrumentType; name: string; icon: string }[] = [
  { id: 'guitar', name: '吉他', icon: '🎸' },
  { id: 'bass', name: '贝斯', icon: '🎸' },
  { id: 'drums', name: '鼓', icon: '🥁' },
  { id: 'keyboard', name: '键盘', icon: '🎹' },
  { id: 'vocals', name: '主唱', icon: '🎤' },
  { id: 'violin', name: '小提琴', icon: '🎻' },
  { id: 'saxophone', name: '萨克斯', icon: '🎷' },
  { id: 'trumpet', name: '小号', icon: '📯' },
];

export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
