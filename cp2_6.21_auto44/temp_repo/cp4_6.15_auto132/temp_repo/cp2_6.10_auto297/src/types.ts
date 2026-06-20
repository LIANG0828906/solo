export type InstrumentType = 'piano' | 'guitar' | 'drum';

export interface InstrumentConfig {
  name: string;
  gradient: [string, string];
  baseFrequency: number;
  harmonicCount: number;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface Ripple {
  id: number;
  x: number;
  y: number;
  startTime: number;
  frequency: number;
  amplitude: number;
  color: [string, string];
  instrument: InstrumentType;
  pitch: string;
  lifetime: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface RecordedPulse {
  id: number;
  x: number;
  y: number;
  instrument: InstrumentType;
  pitch: string;
  timestamp: number;
}

export const INSTRUMENT_CONFIGS: Record<InstrumentType, InstrumentConfig> = {
  piano: {
    name: '钢琴',
    gradient: ['#4a00e0', '#8e2de2'],
    baseFrequency: 261.63,
    harmonicCount: 4,
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.5 }
  },
  guitar: {
    name: '吉他',
    gradient: ['#f12711', '#f5af19'],
    baseFrequency: 196.00,
    harmonicCount: 6,
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.8 }
  },
  drum: {
    name: '鼓',
    gradient: ['#00b09b', '#96c93d'],
    baseFrequency: 150.00,
    harmonicCount: 2,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.3 }
  }
};

export const PITCH_MAP: Record<string, { name: string; freq: number }> = {
  'a': { name: 'C4', freq: 261.63 },
  'w': { name: 'C#4', freq: 277.18 },
  's': { name: 'D4', freq: 293.66 },
  'e': { name: 'D#4', freq: 311.13 },
  'd': { name: 'E4', freq: 329.63 },
  'f': { name: 'F4', freq: 349.23 },
  't': { name: 'F#4', freq: 369.99 },
  'g': { name: 'G4', freq: 392.00 },
  'y': { name: 'G#4', freq: 415.30 },
  'h': { name: 'A4', freq: 440.00 },
  'u': { name: 'A#4', freq: 466.16 },
  'j': { name: 'B4', freq: 493.88 },
  'k': { name: 'C5', freq: 523.25 }
};
