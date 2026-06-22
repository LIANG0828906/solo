export interface Note {
  id: string;
  pitch: number;
  startTime: number;
  duration: number;
}

export interface Fragment {
  id: string;
  name: string;
  notes: Note[];
  expanded: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  fragments: Fragment[];
  createdAt: number;
  updatedAt: number;
}

export type PlaybackState = 'idle' | 'playing' | 'paused';
