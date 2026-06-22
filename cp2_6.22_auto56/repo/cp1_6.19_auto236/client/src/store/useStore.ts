import { create } from 'zustand';

export interface AudioClip {
  id: string;
  fileId: string;
  audioUrl: string;
  startTime: number;
  endTime: number;
  color: string;
  name: string;
}

export interface UploadedFile {
  fileId: string;
  audioUrl: string;
  originalName: string;
  duration: number;
  sampleRate: number;
  amplitude: number[];
}

interface AppState {
  uploadedFile: UploadedFile | null;
  clips: AudioClip[];
  waveformData: number[];
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  playbackPosition: number;
  cardTitle: string;
  cardAuthor: string;
  cardShareUrl: string;

  setUploadedFile: (file: UploadedFile | null) => void;
  setWaveformData: (data: number[]) => void;
  setSelection: (start: number, end: number) => void;
  addClip: (clip: AudioClip) => void;
  removeClip: (id: string) => void;
  reorderClips: (clips: AudioClip[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackPosition: (pos: number) => void;
  setCardTitle: (title: string) => void;
  setCardAuthor: (author: string) => void;
  setCardShareUrl: (url: string) => void;
}

const TRACK_COLORS = ['#4A90D9', '#50C878', '#FF6F61'];

export const useAppStore = create<AppState>((set) => ({
  uploadedFile: null,
  clips: [],
  waveformData: [],
  startTime: 0,
  endTime: 0,
  isPlaying: false,
  playbackPosition: 0,
  cardTitle: '',
  cardAuthor: '',
  cardShareUrl: 'https://wavemix.app/share/demo',

  setUploadedFile: (file) =>
    set({
      uploadedFile: file,
      waveformData: file?.amplitude || [],
      startTime: 0,
      endTime: file?.duration || 0,
      clips: [],
    }),
  setWaveformData: (data) => set({ waveformData: data }),
  setSelection: (start, end) => set({ startTime: start, endTime: end }),
  addClip: (clip) =>
    set((state) => {
      if (state.clips.length >= 3) return state;
      const color = TRACK_COLORS[state.clips.length % 3];
      return { clips: [...state.clips, { ...clip, color }] };
    }),
  removeClip: (id) =>
    set((state) => {
      const newClips = state.clips.filter((c) => c.id !== id);
      return {
        clips: newClips.map((c, i) => ({ ...c, color: TRACK_COLORS[i % 3] })),
      };
    }),
  reorderClips: (clips) =>
    set({
      clips: clips.map((c, i) => ({ ...c, color: TRACK_COLORS[i % 3] })),
    }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackPosition: (pos) => set({ playbackPosition: pos }),
  setCardTitle: (title) => set({ cardTitle: title.slice(0, 20) }),
  setCardAuthor: (author) => set({ cardAuthor: author }),
  setCardShareUrl: (url) => set({ cardShareUrl: url }),
}));
