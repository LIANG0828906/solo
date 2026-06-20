export interface EQFilterConfig {
  type: BiquadFilterType;
  frequency: number;
  gain: number;
  Q: number;
}

export interface EQPreset {
  name: string;
  filters: EQFilterConfig[];
}

export interface TrackSettings {
  id: string;
  volume: number;
  pan: number;
  eqFilters: EQFilterConfig[];
}

export interface MixSettings {
  masterVolume: number;
  masterPan: number;
  activePreset: string | null;
  tracks: TrackSettings[];
}

export interface Track {
  id: string;
  name: string;
  duration: number;
  volume: number;
  pan: number;
  audioBuffer: AudioBuffer | null;
  waveformData: number[];
  isPlaying: boolean;
  isLoaded: boolean;
  eqFilters: EQFilterConfig[];
}

export const EQ_PRESETS: Record<string, EQPreset> = {
  pop: {
    name: '流行',
    filters: [
      { type: 'lowshelf', frequency: 100, gain: 3, Q: 1 },
      { type: 'peaking', frequency: 250, gain: -2, Q: 1 },
      { type: 'peaking', frequency: 2000, gain: 4, Q: 1 },
      { type: 'highshelf', frequency: 8000, gain: 2, Q: 1 }
    ]
  },
  electronic: {
    name: '电子',
    filters: [
      { type: 'lowshelf', frequency: 80, gain: 6, Q: 1 },
      { type: 'peaking', frequency: 120, gain: 3, Q: 1.5 },
      { type: 'peaking', frequency: 4000, gain: 2, Q: 1 },
      { type: 'highshelf', frequency: 10000, gain: 4, Q: 1 }
    ]
  },
  classical: {
    name: '古典',
    filters: [
      { type: 'lowshelf', frequency: 60, gain: 2, Q: 1 },
      { type: 'peaking', frequency: 500, gain: -1, Q: 1 },
      { type: 'peaking', frequency: 3000, gain: 1, Q: 1 },
      { type: 'highshelf', frequency: 12000, gain: 3, Q: 1 }
    ]
  }
};
