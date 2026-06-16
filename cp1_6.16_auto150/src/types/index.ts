export type NoteType = 'top' | 'middle' | 'base';

export interface NoteDimensions {
  fresh: number;
  warm: number;
  sweet: number;
  spicy: number;
  woody: number;
}

export interface Note {
  id: string;
  name: string;
  color: string;
  description: string;
  type: NoteType;
  dimensions: NoteDimensions;
}

export interface Comment {
  id: string;
  username: string;
  content: string;
  createdAt: Date;
}

export interface PerfumeProfile {
  id: string;
  name: string;
  createdAt: Date;
  topNotes: Note[];
  middleNotes: Note[];
  baseNotes: Note[];
  concentration: number;
  diffusion: number;
  longevity: number;
  rating: number;
  comments: Comment[];
}

export interface PerfumeState {
  selectedTopNotes: Note[];
  selectedMiddleNotes: Note[];
  selectedBaseNotes: Note[];
  concentration: number;
  diffusion: number;
  longevity: number;
  profiles: PerfumeProfile[];
  addNote: (note: Note) => void;
  removeNote: (noteId: string) => void;
  setConcentration: (value: number) => void;
  setDiffusion: (value: number) => void;
  setLongevity: (value: number) => void;
  createProfile: () => PerfumeProfile;
  addComment: (profileId: string, comment: Comment) => void;
  getRating: () => number;
  getProfileById: (id: string) => PerfumeProfile | undefined;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
}
