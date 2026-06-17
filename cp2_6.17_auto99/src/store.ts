import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type WaveformPoint = { x: number; y: number };

export type WaveformData = {
  id: string;
  points: WaveformPoint[];
  trackId: string;
};

export type OscillatorType = 'sine' | 'square' | 'sawtooth';

export type Track = {
  id: string;
  name: string;
  muted: boolean;
  waveformPoints: WaveformPoint[];
};

export type AppState = {
  waveforms: WaveformData[];
  currentWaveform: WaveformPoint[];
  timbre: OscillatorType;
  volume: number;
  bpm: number;
  reverbEnabled: boolean;
  tracks: Track[];
  playbackProgress: number;
  isPlaying: boolean;
  draggingTrackId: string | null;

  setTimbre: (timbre: OscillatorType) => void;
  setVolume: (volume: number) => void;
  setBpm: (bpm: number) => void;
  toggleReverb: () => void;
  setCurrentWaveform: (points: WaveformPoint[] | ((prev: WaveformPoint[]) => WaveformPoint[])) => void;
  addWaveform: (points: WaveformPoint[], trackId: string) => void;
  clearWaveforms: () => void;
  toggleMute: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  setPlaybackProgress: (progress: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setDraggingTrackId: (id: string | null) => void;
  updateTrackWaveform: (trackId: string, points: WaveformPoint[]) => void;
};

const createInitialTracks = (): Track[] => [
  {
    id: uuidv4(),
    name: 'Track 1',
    muted: false,
    waveformPoints: [],
  },
  {
    id: uuidv4(),
    name: 'Track 2',
    muted: false,
    waveformPoints: [],
  },
];

export const useStore = create<AppState>((set) => ({
  waveforms: [],
  currentWaveform: [],
  timbre: 'sine',
  volume: 70,
  bpm: 120,
  reverbEnabled: false,
  tracks: createInitialTracks(),
  playbackProgress: 0,
  isPlaying: false,
  draggingTrackId: null,

  setTimbre: (timbre) => set({ timbre }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),
  setBpm: (bpm) => set({ bpm: Math.max(30, Math.min(300, bpm)) }),
  toggleReverb: () => set((state) => ({ reverbEnabled: !state.reverbEnabled })),
  setCurrentWaveform: (points) =>
    set((state) => ({
      currentWaveform: typeof points === 'function' ? points(state.currentWaveform) : points,
    })),
  addWaveform: (points, trackId) =>
    set((state) => ({
      waveforms: [...state.waveforms, { id: uuidv4(), points, trackId }],
    })),
  clearWaveforms: () => set({ waveforms: [], currentWaveform: [] }),
  toggleMute: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      ),
    })),
  reorderTracks: (fromIndex, toIndex) =>
    set((state) => {
      const newTracks = [...state.tracks];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      return { tracks: newTracks };
    }),
  setPlaybackProgress: (progress) => set({ playbackProgress: progress }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setDraggingTrackId: (id) => set({ draggingTrackId: id }),
  updateTrackWaveform: (trackId, points) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, waveformPoints: points } : track
      ),
    })),
}));
