import { create } from 'zustand';
import { ADSREnvelope, WaveType } from '../waveform/WaveformGenerator';

export interface TrackState {
  id: string;
  name: string;
  waveType: WaveType;
  frequency: number;
  amplitude: number;
  phase: number;
  adsr: ADSREnvelope;
  volume: number;
  pan: number;
  color: string;
  muted: boolean;
}

interface AppState {
  tracks: TrackState[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  leftPanelWidth: number;
  rightPanelWidth: number;
  spectrumDrawerOpen: boolean;
  bufferUsage: number;
  windowWidth: number;

  updateTrack: (id: string, updates: Partial<TrackState>) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (d: number) => void;
  setLeftPanelWidth: (w: number) => void;
  setRightPanelWidth: (w: number) => void;
  toggleSpectrumDrawer: () => void;
  setBufferUsage: (u: number) => void;
  setWindowWidth: (w: number) => void;
}

const TRACK_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe'];
const TRACK_NAMES = ['Track 1', 'Track 2', 'Track 3', 'Track 4'];

const createDefaultTracks = (): TrackState[] =>
  TRACK_NAMES.map((name, i) => ({
    id: `track-${i}`,
    name,
    waveType: 'sine' as WaveType,
    frequency: 220 * (i + 1),
    amplitude: 0.5,
    phase: 0,
    adsr: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 },
    volume: -6,
    pan: 0,
    color: TRACK_COLORS[i],
    muted: false,
  }));

export const useAppStore = create<AppState>((set) => ({
  tracks: createDefaultTracks(),
  isPlaying: false,
  currentTime: 0,
  duration: 4,
  leftPanelWidth: 280,
  rightPanelWidth: 320,
  spectrumDrawerOpen: false,
  bufferUsage: 0,
  windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,

  updateTrack: (id, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (d) => set({ duration: d }),
  setLeftPanelWidth: (w) => set({ leftPanelWidth: Math.max(200, Math.min(500, w)) }),
  setRightPanelWidth: (w) => set({ rightPanelWidth: Math.max(240, Math.min(500, w)) }),
  toggleSpectrumDrawer: () => set((s) => ({ spectrumDrawerOpen: !s.spectrumDrawerOpen })),
  setBufferUsage: (u) => set({ bufferUsage: u }),
  setWindowWidth: (w) => set({ windowWidth: w }),
}));
