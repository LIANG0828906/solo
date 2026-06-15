export type TrackType = 'melody' | 'drum' | 'harmony';

export interface Note {
  id: string;
  time: number;
  track: TrackType;
  y: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface GameState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  notes: Note[];
  particles: Particle[];
  performanceMode: 'normal' | 'low';
}

export interface EngineOptions {
  bpm?: number;
  noteFlyTime?: number;
  judgementLineX?: number;
}

export interface EditorNote extends Note {
  snappingTarget?: number;
  isDragging?: boolean;
}

export interface EditorState {
  notes: EditorNote[];
  currentTime: number;
  bpm: number;
  pixelsPerSecond: number;
  scrollLeft: number;
  selectedNoteId: string | null;
  isDragging: boolean;
}

export interface SnapResult {
  snappedTime: number;
  snappedBeat: number;
}

export interface GridLine {
  pixel: number;
  time: number;
  type: 'beat' | 'quarter' | 'sixteenth';
  height: number;
}

export interface RenderState {
  width: number;
  height: number;
  currentTime: number;
  notes: Note[];
  particles: Particle[];
  isPlaying: boolean;
  bpm: number;
  performanceMode: 'normal' | 'low';
  judgementLineX: number;
  noteFlyTime: number;
}

export const TRACK_COLORS: Record<TrackType, string> = {
  melody: '#ff3366',
  drum: '#3399ff',
  harmony: '#ffcc00',
};

export const TRACK_LABELS: Record<TrackType, string> = {
  melody: '主旋律',
  drum: '鼓点',
  harmony: '和声',
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}
