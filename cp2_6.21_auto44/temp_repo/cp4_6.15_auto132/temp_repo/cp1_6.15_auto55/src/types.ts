export interface WaveformParams {
  type: OscillatorType;
  frequency: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface EnvelopePhase {
  phase: 'idle' | 'attack' | 'decay' | 'sustain' | 'release';
  progress: number;
  amplitude: number;
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  envelope: EnvelopePhase;
  showSpectrum: boolean;
}

export interface WaveformTransition {
  active: boolean;
  startTime: number;
  duration: number;
  fromType: OscillatorType;
  toType: OscillatorType;
}

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const getWaveformValue = (type: OscillatorType, phase: number): number => {
  const p = ((phase % Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  
  switch (type) {
    case 'sine':
      return Math.sin(p);
    case 'square':
      return Math.sin(p) >= 0 ? 1 : -1;
    case 'sawtooth':
      return 2 * (p / (Math.PI * 2) - 0.5);
    case 'triangle':
      const x = p / (Math.PI * 2);
      return 4 * Math.abs(x - Math.floor(x + 0.5)) - 1;
    default:
      return Math.sin(p);
  }
};

export const freqToGridDensity = (freq: number): number => {
  const minDensity = 32;
  const maxDensity = 128;
  const normalized = Math.log2(freq / 20) / Math.log2(2000 / 20);
  return Math.round(lerp(minDensity, maxDensity, normalized));
};

export const freqToAmplitudeScale = (freq: number): number => {
  const minScale = 0.7;
  const maxScale = 1.0;
  const normalized = 1 - Math.log2(freq / 20) / Math.log2(2000 / 20);
  return lerp(minScale, maxScale, Math.max(0, normalized));
};
