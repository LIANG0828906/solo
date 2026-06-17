export interface Emotion {
  name: '喜悦' | '焦虑' | '平静';
  color: string;
  intensity: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  inputText: string;
  emotions: Emotion[];
  thumbnailData: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  emotion: '喜悦' | '焦虑' | '平静';
  opacity: number;
  phase: number;
  sineAmp: number;
  sineFreq: number;
  isFused: boolean;
  fuseLife: number;
  fuseMaxLife: number;
  fading: boolean;
}
