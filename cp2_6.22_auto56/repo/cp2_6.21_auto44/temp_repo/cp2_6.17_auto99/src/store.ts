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

const STORAGE_KEY = 'soundcanvas_state_v1';

type PersistedState = {
  timbre: OscillatorType;
  volume: number;
  bpm: number;
  reverbEnabled: boolean;
  tracks: Track[];
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

const loadPersistedState = (): Partial<PersistedState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedState;
    return parsed;
  } catch (e) {
    return {};
  }
};

const savePersistedState = (state: PersistedState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore storage errors
  }
};

const persisted = loadPersistedState();

const initialTracks: Track[] = (() => {
  if (persisted.tracks && persisted.tracks.length >= 2) {
    return persisted.tracks.map((t) => ({
      ...t,
      id: t.id || uuidv4(),
      waveformPoints: t.waveformPoints || [],
    }));
  }
  return createInitialTracks();
})();

export const useStore = create<AppState>((set, get) => ({
  waveforms: [],
  currentWaveform: [],
  timbre: persisted.timbre || 'sine',
  volume: typeof persisted.volume === 'number' ? persisted.volume : 70,
  bpm: typeof persisted.bpm === 'number' ? persisted.bpm : 120,
  reverbEnabled: !!persisted.reverbEnabled,
  tracks: initialTracks,
  playbackProgress: 0,
  isPlaying: false,
  draggingTrackId: null,

  setTimbre: (timbre) => {
    set({ timbre });
    savePersistedState({
      timbre,
      volume: get().volume,
      bpm: get().bpm,
      reverbEnabled: get().reverbEnabled,
      tracks: get().tracks,
    });
  },
  setVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    set({ volume: clampedVolume });
    savePersistedState({
      timbre: get().timbre,
      volume: clampedVolume,
      bpm: get().bpm,
      reverbEnabled: get().reverbEnabled,
      tracks: get().tracks,
    });
  },
  setBpm: (bpm) => {
    const clampedBpm = Math.max(30, Math.min(300, bpm));
    set({ bpm: clampedBpm });
    savePersistedState({
      timbre: get().timbre,
      volume: get().volume,
      bpm: clampedBpm,
      reverbEnabled: get().reverbEnabled,
      tracks: get().tracks,
    });
  },
  toggleReverb: () => {
    set((state) => {
      const reverbEnabled = !state.reverbEnabled;
      savePersistedState({
        timbre: state.timbre,
        volume: state.volume,
        bpm: state.bpm,
        reverbEnabled,
        tracks: state.tracks,
      });
      return { reverbEnabled };
    });
  },
  setCurrentWaveform: (points) =>
    set((state) => ({
      currentWaveform: typeof points === 'function' ? points(state.currentWaveform) : points,
    })),
  addWaveform: (points, trackId) =>
    set((state) => ({
      waveforms: [...state.waveforms, { id: uuidv4(), points, trackId }],
    })),
  clearWaveforms: () => set({ waveforms: [], currentWaveform: [] }),
  toggleMute: (trackId) => {
    set((state) => {
      const tracks = state.tracks.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      );
      savePersistedState({
        timbre: state.timbre,
        volume: state.volume,
        bpm: state.bpm,
        reverbEnabled: state.reverbEnabled,
        tracks,
      });
      return { tracks };
    });
  },
  reorderTracks: (fromIndex, toIndex) => {
    set((state) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.tracks.length ||
        toIndex >= state.tracks.length
      ) {
        return state;
      }
      const newTracks = [...state.tracks];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      savePersistedState({
        timbre: state.timbre,
        volume: state.volume,
        bpm: state.bpm,
        reverbEnabled: state.reverbEnabled,
        tracks: newTracks,
      });
      return { tracks: newTracks };
    });
  },
  setPlaybackProgress: (progress) => set({ playbackProgress: progress }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setDraggingTrackId: (id) => set({ draggingTrackId: id }),
  updateTrackWaveform: (trackId, points) => {
    set((state) => {
      const tracks = state.tracks.map((track) =>
        track.id === trackId ? { ...track, waveformPoints: points } : track
      );
      savePersistedState({
        timbre: state.timbre,
        volume: state.volume,
        bpm: state.bpm,
        reverbEnabled: state.reverbEnabled,
        tracks,
      });
      return { tracks };
    });
  },
}));
