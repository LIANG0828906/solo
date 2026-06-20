import { create } from 'zustand';

export type ThemeName = 'flame' | 'aurora' | 'neon';

export interface AudioData {
  frequencies: number[];
  waveform: number[];
  bass: number;
  mid: number;
  treble: number;
  amplitude: number;
  beat: boolean;
  currentTime: number;
  duration: number;
}

export interface PlayerState {
  isPlaying: boolean;
  audioFile: File | null;
  audioData: AudioData;
  theme: ThemeName;
  particleDensity: number;
  waveSensitivity: number;
  rotationSpeed: number;
  isExporting: boolean;
  exportProgress: number;

  setPlaying: (playing: boolean) => void;
  setAudioFile: (file: File | null) => void;
  setAudioData: (data: AudioData) => void;
  setTheme: (theme: ThemeName) => void;
  setParticleDensity: (density: number) => void;
  setWaveSensitivity: (sensitivity: number) => void;
  setRotationSpeed: (speed: number) => void;
  setExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  resetParticleDensity: () => void;
  resetWaveSensitivity: () => void;
  resetRotationSpeed: () => void;
}

const DEFAULT_PARTICLE_DENSITY = 20;
const DEFAULT_WAVE_SENSITIVITY = 3;
const DEFAULT_ROTATION_SPEED = 1;

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  audioFile: null,
  audioData: {
    frequencies: new Array(1024).fill(0),
    waveform: new Array(2048).fill(128),
    bass: 0,
    mid: 0,
    treble: 0,
    amplitude: 0,
    beat: false,
    currentTime: 0,
    duration: 0,
  },
  theme: 'flame',
  particleDensity: DEFAULT_PARTICLE_DENSITY,
  waveSensitivity: DEFAULT_WAVE_SENSITIVITY,
  rotationSpeed: DEFAULT_ROTATION_SPEED,
  isExporting: false,
  exportProgress: 0,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setAudioFile: (file) => set({ audioFile: file }),
  setAudioData: (data) => set({ audioData: data }),
  setTheme: (theme) => set({ theme }),
  setParticleDensity: (density) => set({ particleDensity: density }),
  setWaveSensitivity: (sensitivity) => set({ waveSensitivity: sensitivity }),
  setRotationSpeed: (speed) => set({ rotationSpeed: speed }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  resetParticleDensity: () => set({ particleDensity: DEFAULT_PARTICLE_DENSITY }),
  resetWaveSensitivity: () => set({ waveSensitivity: DEFAULT_WAVE_SENSITIVITY }),
  resetRotationSpeed: () => set({ rotationSpeed: DEFAULT_ROTATION_SPEED }),
}));
