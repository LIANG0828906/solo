export interface BellData {
  id: number;
  name: string;
  note: string;
  frequency: number;
  size: number;
  color: string;
  position: [number, number, number];
  layer: 'upper' | 'lower';
  inscription: string;
}

export interface RecordingNote {
  bellId: number;
  timestamp: number;
  duration: number;
}

export interface WaveParticle {
  id: number;
  bellId: number;
  radius: number;
  opacity: number;
  position: [number, number, number];
}

export interface PlayingState {
  activeBellId: number | null;
  frequency: number;
  bellName: string;
  note: string;
}

export type PlayMode = 'single' | 'record';
