export const NUM_POINTS = 128;
export const NUM_MODES = 32;
export const PICKUP_POSITION = 0.25;
export const FFT_SIZE = 2048;
export const SAMPLE_RATE = 44100;
export const AUDIO_DURATION = 2;
export const MAX_AMPLITUDE = 0.15;

export interface HarmonicInfo {
  freq: number;
  amplitude: number;
}

export interface PresetConfig {
  name: string;
  icon: string;
  tension: number;
  linearDensity: number;
  stringLength: number;
  damping: number;
  pluckPosition: number;
  pluckForce: number;
}

export const PRESETS: PresetConfig[] = [
  { name: '吉他', icon: '🎸', tension: 73, linearDensity: 0.6, stringLength: 65, damping: 0.3, pluckPosition: 0.2, pluckForce: 0.08 },
  { name: '大提琴', icon: '🎻', tension: 55, linearDensity: 2.8, stringLength: 140, damping: 0.25, pluckPosition: 0.15, pluckForce: 0.12 },
  { name: '竖琴', icon: '🪕', tension: 40, linearDensity: 1.0, stringLength: 120, damping: 0.15, pluckPosition: 0.35, pluckForce: 0.1 },
  { name: '古筝', icon: '🎵', tension: 30, linearDensity: 1.5, stringLength: 160, damping: 0.2, pluckPosition: 0.12, pluckForce: 0.09 },
  { name: '琵琶', icon: '🎶', tension: 45, linearDensity: 1.2, stringLength: 100, damping: 0.35, pluckPosition: 0.5, pluckForce: 0.11 },
  { name: '二胡', icon: '🎼', tension: 35, linearDensity: 0.8, stringLength: 80, damping: 0.4, pluckPosition: 0.3, pluckForce: 0.07 },
];

export type PresetName = '吉他' | '大提琴' | '竖琴' | '古筝' | '琵琶' | '二胡';
