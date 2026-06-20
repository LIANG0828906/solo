import { create } from 'zustand';
import { AudioItem, Emotion } from './api';

interface AudioState {
  audios: AudioItem[];
  currentPlayingId: string | null;
  filterEmotion: Emotion | null;
  isLoading: boolean;

  setAudios: (audios: AudioItem[]) => void;
  addAudio: (audio: AudioItem) => void;
  setCurrentPlaying: (id: string | null) => void;
  setFilterEmotion: (emotion: Emotion | null) => void;
  setLoading: (loading: boolean) => void;
  incrementLikes: (id: string) => void;
  getFilteredAudios: () => AudioItem[];
}

export const useAudioStore = create<AudioState>((set, get) => ({
  audios: [],
  currentPlayingId: null,
  filterEmotion: null,
  isLoading: false,

  setAudios: (audios) => set({ audios }),
  addAudio: (audio) =>
    set((state) => ({ audios: [audio, ...state.audios] })),
  setCurrentPlaying: (id) => set({ currentPlayingId: id }),
  setFilterEmotion: (emotion) => set({ filterEmotion: emotion }),
  setLoading: (loading) => set({ isLoading: loading }),
  incrementLikes: (id) =>
    set((state) => ({
      audios: state.audios.map((a) =>
        a.id === id ? { ...a, likes: a.likes + 1 } : a
      ),
    })),
  getFilteredAudios: () => {
    const { audios, filterEmotion } = get();
    if (!filterEmotion) return audios;
    return audios.filter((a) => a.emotion === filterEmotion);
  },
}));
