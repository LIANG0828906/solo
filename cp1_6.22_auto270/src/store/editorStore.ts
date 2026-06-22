import { create } from 'zustand';
import { generateMockTracks, createWavBlob, trimChannelData } from '@/utils/mockData';
import type { MockTrackData } from '@/utils/mockData';

export interface Track {
  id: string;
  name: string;
  duration: number;
  volume: number;
  waveColor: string;
  sampleRate: number;
  channelData: Float32Array;
  wavBlob: Blob;
  isTrimming: boolean;
  trimStart: number;
  trimEnd: number;
  splicePoints: number[];
}

interface EditorStore {
  tracks: Track[];
  isPlaying: boolean;
  currentTime: number;
  showExportModal: boolean;

  initTracks: () => void;
  removeTrack: (id: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  updateTrackVolume: (id: string, volume: number) => void;
  setTrackTrimming: (id: string, isTrimming: boolean) => void;
  setTrackTrimPoints: (id: string, start: number, end: number) => void;
  applyTrim: (id: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setShowExportModal: (show: boolean) => void;
}

function mockTrackToTrack(mock: MockTrackData, index: number): Track {
  return {
    id: mock.id,
    name: mock.name,
    duration: mock.duration,
    volume: 70,
    waveColor: mock.waveColor,
    sampleRate: mock.sampleRate,
    channelData: mock.channelData,
    wavBlob: createWavBlob(mock.channelData, mock.sampleRate),
    isTrimming: false,
    trimStart: index === 0 ? 5 : 3,
    trimEnd: index === 0 ? 10 : 8,
    splicePoints: [],
  };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tracks: [],
  isPlaying: false,
  currentTime: 0,
  showExportModal: false,

  initTracks: () => {
    const mocks = generateMockTracks();
    const tracks = mocks.map((m, i) => mockTrackToTrack(m, i));
    set({ tracks });
  },

  removeTrack: (id) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
    }));
  },

  reorderTracks: (fromIndex, toIndex) => {
    set((state) => {
      const newTracks = [...state.tracks];
      const [moved] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, moved);
      return { tracks: newTracks };
    });
  },

  updateTrackVolume: (id, volume) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, volume } : t)),
    }));
  },

  setTrackTrimming: (id, isTrimming) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, isTrimming } : t)),
    }));
  },

  setTrackTrimPoints: (id, start, end) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, trimStart: start, trimEnd: end } : t
      ),
    }));
  },

  applyTrim: (id) => {
    const track = get().tracks.find((t) => t.id === id);
    if (!track) return;
    const { trimmedData, newDuration } = trimChannelData(
      track.channelData,
      track.sampleRate,
      track.trimStart,
      track.trimEnd
    );
    const newBlob = createWavBlob(trimmedData, track.sampleRate);
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id
          ? {
              ...t,
              channelData: trimmedData,
              wavBlob: newBlob,
              duration: newDuration,
              isTrimming: false,
              splicePoints: [...t.splicePoints, track.trimStart],
            }
          : t
      ),
    }));
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setShowExportModal: (show) => set({ showExportModal: show }),
}));
