export type BeatType = 'accent' | 'normal' | 'mute';

export interface BeatPattern {
  id: string;
  name: string;
  beats: BeatType[];
}

export type SoundType = 'click' | 'shake' | 'woodblock';

export interface VisualizerConfig {
  particleCount: number;
  particleMinSize: number;
  particleMaxSize: number;
  glowMinSize: number;
  glowMaxSize: number;
  waveLineWidth: number;
}

export interface BeatState {
  bpm: number;
  isPlaying: boolean;
  currentBeatIndex: number;
  pattern: BeatPattern;
  soundType: SoundType;
  volume: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface BeatSignal {
  beatIndex: number;
  beatType: BeatType;
  timestamp: number;
  intensity: number;
}

export const ACCENT_COLOR = '#F44336';
export const NORMAL_COLOR = '#2196F3';
export const MUTE_COLOR = '#9E9E9E';
export const WAVE_COLOR_START = '#00E5FF';
export const WAVE_COLOR_END = '#D500F9';
export const PRIMARY_COLOR = '#3f51b5';
export const PRIMARY_HOVER_COLOR = '#303f9f';
export const CONTROL_BG = '#FAFAFA';
export const CANVAS_BG = '#1E1E1E';
export const APP_BG = '#121212';
