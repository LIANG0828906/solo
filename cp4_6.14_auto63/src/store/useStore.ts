import { create } from 'zustand';
import { AudioEngineState, PlaybackState, TrackState, EffectState, SelectionRange } from '@types/index';

interface MixerStore extends AudioEngineState {
  selectedTrackId: string | null;
  selectedEffect: { trackId: string; effectId: string } | null;
  showEffectPanel: boolean;
  selection: SelectionRange | null;
  isEffectsPanelOpen: boolean;
  setSelectedTrackId: (id: string | null) => void;
  setSelectedEffect: (trackId: string, effectId: string) => void;
  setShowEffectPanel: (show: boolean) => void;
  setSelection: (selection: SelectionRange | null) => void;
  setIsEffectsPanelOpen: (open: boolean) => void;
  setState: (state: AudioEngineState) => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  updateTrack: (trackId: string, updates: Partial<TrackState>) => void;
}

export const useMixerStore = create<MixerStore>((set) => ({
  tracks: [],
  playback: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    bpm: 120,
  },
  masterVolume: 80,
  selectedTrackId: null,
  selectedEffect: null,
  showEffectPanel: false,
  selection: null,
  isEffectsPanelOpen: true,

  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  setSelectedEffect: (trackId, effectId) =>
    set({ selectedEffect: { trackId, effectId }, showEffectPanel: true }),
  setShowEffectPanel: (show) => set({ showEffectPanel: show }),
  setSelection: (selection) => set({ selection }),
  setIsEffectsPanelOpen: (open) => set({ isEffectsPanelOpen: open }),

  setState: (state) =>
    set({
      tracks: state.tracks,
      playback: state.playback,
      masterVolume: state.masterVolume,
    }),

  setPlaybackState: (state) =>
    set((prev) => ({
      playback: { ...prev.playback, ...state },
    })),

  updateTrack: (trackId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, ...updates } : t,
      ),
    })),
}));
