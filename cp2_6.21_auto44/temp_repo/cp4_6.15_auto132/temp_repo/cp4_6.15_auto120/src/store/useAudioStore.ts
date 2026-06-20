import { create } from 'zustand';
import type { TrackState } from '../types';

interface AudioStoreState {
  tracks: TrackState[];
  masterVolume: number;
  isPlaying: boolean;
  isRecording: boolean;
  recordingTime: number;
  selectedTrackId: string | null;
  setTrackVolume: (id: string, volume: number) => void;
  setTrackPan: (id: string, pan: number) => void;
  toggleTrack: (id: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  setMasterVolume: (volume: number) => void;
  setSelectedTrackId: (id: string | null) => void;
  startRecording: () => void;
  stopRecording: () => void;
  incrementRecordingTime: () => void;
}

const initialTracks: TrackState[] = [
  {
    id: 'track-1',
    type: 'piano',
    name: '钢琴',
    icon: 'Piano',
    enabled: false,
    volume: 0.7,
    pan: 0,
    order: 0,
  },
  {
    id: 'track-2',
    type: 'epiano',
    name: '电钢琴',
    icon: 'Music',
    enabled: false,
    volume: 0.7,
    pan: 0,
    order: 1,
  },
  {
    id: 'track-3',
    type: 'strings',
    name: '弦乐',
    icon: 'Music2',
    enabled: false,
    volume: 0.7,
    pan: 0,
    order: 2,
  },
  {
    id: 'track-4',
    type: 'drums',
    name: '鼓组',
    icon: 'Drum',
    enabled: false,
    volume: 0.7,
    pan: 0,
    order: 3,
  },
  {
    id: 'track-5',
    type: 'synth-lead',
    name: '合成器Lead',
    icon: 'Zap',
    enabled: false,
    volume: 0.7,
    pan: 0,
    order: 4,
  },
  {
    id: 'track-6',
    type: 'synth-pad',
    name: '合成器Pad',
    icon: 'Waves',
    enabled: false,
    volume: 0.7,
    pan: 0,
    order: 5,
  },
];

export const useAudioStore = create<AudioStoreState>((set) => ({
  tracks: initialTracks,
  masterVolume: 0.8,
  isPlaying: false,
  isRecording: false,
  recordingTime: 0,
  selectedTrackId: null,

  setTrackVolume: (id, volume) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === id ? { ...track, volume } : track
      ),
    })),

  setTrackPan: (id, pan) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === id ? { ...track, pan } : track
      ),
    })),

  toggleTrack: (id) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === id ? { ...track, enabled: !track.enabled } : track
      ),
    })),

  reorderTracks: (fromIndex, toIndex) =>
    set((state) => {
      const newTracks = [...state.tracks];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      return {
        tracks: newTracks.map((track, index) => ({ ...track, order: index })),
      };
    }),

  setMasterVolume: (volume) => set({ masterVolume: volume }),

  setSelectedTrackId: (id) => set({ selectedTrackId: id }),

  startRecording: () => set({ isRecording: true, recordingTime: 0 }),

  stopRecording: () => set({ isRecording: false }),

  incrementRecordingTime: () =>
    set((state) => ({ recordingTime: state.recordingTime + 1 })),
}));
