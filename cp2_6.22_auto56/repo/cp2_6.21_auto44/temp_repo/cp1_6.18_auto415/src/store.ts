import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Work, TextSegment, WorkListItem } from './types';

interface AppState {
  user: User | null;
  token: string | null;
  currentWork: Work | null;
  works: WorkListItem[];
  isPlaying: boolean;
  currentTime: number;
  currentEmotion: string;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setCurrentWork: (work: Work | null) => void;
  setWorks: (works: WorkListItem[]) => void;
  addWork: (work: WorkListItem) => void;
  updateWork: (id: string, updates: Partial<WorkListItem>) => void;
  removeWork: (id: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setCurrentEmotion: (emotion: string) => void;
  updateTextSegment: (segmentId: string, updates: Partial<TextSegment>) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      currentWork: null,
      works: [],
      isPlaying: false,
      currentTime: 0,
      currentEmotion: 'neutral',
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setCurrentWork: (currentWork) => set({ currentWork }),
      setWorks: (works) => set({ works }),
      
      addWork: (work) => set((state) => ({
        works: [work, ...state.works]
      })),
      
      updateWork: (id, updates) => set((state) => ({
        works: state.works.map(w => w.id === id ? { ...w, ...updates } : w)
      })),
      
      removeWork: (id) => set((state) => ({
        works: state.works.filter(w => w.id !== id)
      })),
      
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setCurrentEmotion: (currentEmotion) => set({ currentEmotion }),
      
      updateTextSegment: (segmentId, updates) => set((state) => {
        if (!state.currentWork) return state;
        return {
          currentWork: {
            ...state.currentWork,
            text_segments: state.currentWork.text_segments.map(s =>
              s.id === segmentId ? { ...s, ...updates } : s
            )
          }
        };
      }),
      
      logout: () => set({
        user: null,
        token: null,
        currentWork: null,
        works: [],
        isPlaying: false,
        currentTime: 0,
        currentEmotion: 'neutral'
      })
    }),
    {
      name: 'ciyingliusheng-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token
      })
    }
  )
);
