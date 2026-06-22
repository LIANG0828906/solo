export type VisualMode = 'wave' | 'particle' | 'hybrid';

export interface AudioStateData {
  file: File | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  mode: VisualMode;
  amplitudes: Float32Array;
  frequencies: Float32Array;
}

export interface WaveConfig {
  cylinderHeight: number;
  cylinderRadius: number;
  segmentsX: number;
  segmentsY: number;
  waveHeight: number;
  colorLow: string;
  colorHigh: string;
}

export const DEFAULT_WAVE_CONFIG: WaveConfig = {
  cylinderHeight: 20,
  cylinderRadius: 6,
  segmentsX: 360,
  segmentsY: 64,
  waveHeight: 2,
  colorLow: '#E53935',
  colorHigh: '#1E88E5',
};

export const PULSE_COLOR = '#FFD54F';
export const BACKGROUND_COLOR = '#0A0A1A';
export const BACKGROUND_COLOR_END = '#1A1A3E';
