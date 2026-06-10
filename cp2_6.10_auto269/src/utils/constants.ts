import { ScaleNote } from '@/types';

export const SCALE_FREQUENCIES: Record<ScaleNote, number> = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.00,
  A: 440.00,
  B: 493.88,
};

export const SCALE_NAMES: Record<ScaleNote, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
};

export const ADJACENT_SCALES: Record<ScaleNote, ScaleNote[]> = {
  C: ['D'],
  D: ['C', 'E'],
  E: ['D', 'F'],
  F: ['E', 'G'],
  G: ['F', 'A'],
  A: ['G', 'B'],
  B: ['A'],
};

export const PARTICLE_COLORS: Record<ScaleNote, string> = {
  C: '#4169e1',
  D: '#4682b4',
  E: '#3cb371',
  F: '#9acd32',
  G: '#ffd700',
  A: '#ff8c00',
  B: '#ff4500',
};

export const SCALE_POSITIONS: Record<ScaleNote, [number, number, number]> = {
  C: [-6, 0, 0],
  D: [-4, 0.2, 1],
  E: [-2, 0.3, 1.5],
  F: [0, 0.35, 1.7],
  G: [2, 0.3, 1.5],
  A: [4, 0.2, 1],
  B: [6, 0, 0],
};

export const SCALE_NOTES: ScaleNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const COLORS = {
  sky: '#b0d4f1',
  cloud: '#f0f8ff',
  bronze: '#cd7f32',
  bronzeDark: '#8b4513',
  bronzeLight: '#daa520',
  platform: 'rgba(240, 248, 255, 0.3)',
  platformBorder: 'rgba(255, 255, 255, 0.5)',
};

export const HARMONY_DISTANCE_THRESHOLD = 3.5;
export const MAX_PLAYED_NOTES = 10;
export const MIN_BELLS = 3;
export const MAX_BELLS = 10;
export const DEFAULT_VELOCITY = 70;
export const BELL_SIZE_RANGE = [0.6, 1.2];
