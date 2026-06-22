import { create } from 'zustand';
import type { AudioItem, UserInfo, PlayState, UploadState, EmotionType } from '@/types';

interface GalleryState {
  audioList: AudioItem[];
  userInfo: UserInfo;
  playState: PlayState;
  uploadState: UploadState;
  currentEmotion: EmotionType | null;
  currentIntensity: number;
}

interface GalleryActions {
  addAudio: (audio: AudioItem) => void;
  removeAudio: (id: string) => void;
  incrementPlayCount: (id: string) => void;
  setPlayState: (state: Partial<PlayState>) => void;
  setUploadState: (state: Partial<UploadState>) => void;
  setCurrentEmotion: (emotion: EmotionType | null, intensity: number) => void;
  setAudioList: (list: AudioItem[]) => void;
}

export const useGalleryStore = create<GalleryState & GalleryActions>((set) => ({
  audioList: [],
  userInfo: {
    id: 'user-001',
    nickname: '音乐旅人',
    avatar: '',
  },
  playState: {
    isPlaying: false,
    currentAudioId: null,
    isFullscreen: false,
  },
  uploadState: {
    isUploading: false,
    progress: 0,
    error: null,
  },
  currentEmotion: null,
  currentIntensity: 0,

  addAudio: (audio) =>
    set((state) => ({
      audioList: [audio, ...state.audioList],
    })),

  removeAudio: (id) =>
    set((state) => ({
      audioList: state.audioList.filter((a) => a.id !== id),
    })),

  incrementPlayCount: (id) =>
    set((state) => ({
      audioList: state.audioList.map((a) =>
        a.id === id ? { ...a, playCount: a.playCount + 1 } : a
      ),
    })),

  setPlayState: (newState) =>
    set((state) => ({
      playState: { ...state.playState, ...newState },
    })),

  setUploadState: (newState) =>
    set((state) => ({
      uploadState: { ...state.uploadState, ...newState },
    })),

  setCurrentEmotion: (emotion, intensity) =>
    set({
      currentEmotion: emotion,
      currentIntensity: intensity,
    }),

  setAudioList: (list) => set({ audioList: list }),
}));
