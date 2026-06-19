import { create } from 'zustand';
import type { Frame, PixelColor, User, FrameData } from './types';
import { createEmptyFrame } from './utils/frame';

interface AppState {
  frames: Frame[];
  currentFrameId: string;
  currentColor: PixelColor;
  onlineUsers: User[];
  localUser: User | null;
  editCount: number;
  gifUrl: string | null;
  isPlaying: boolean;
  isGenerating: boolean;
  setFrames: (f: Frame[]) => void;
  setCurrentFrame: (id: string) => void;
  setCurrentColor: (c: PixelColor) => void;
  setLocalUser: (u: User) => void;
  setOnlineUsers: (users: User[]) => void;
  updatePixel: (frameId: string, x: number, y: number, color: PixelColor, broadcast?: boolean) => void;
  addFrame: () => void;
  removeFrame: (id: string) => void;
  reorderFrames: (from: number, to: number) => void;
  setFrameEditor: (frameId: string, userId: string | undefined) => void;
  setGifUrl: (url: string | null) => void;
  incrementEditCount: () => void;
  setIsPlaying: (p: boolean) => void;
  setIsGenerating: (g: boolean) => void;
  replaceFrameData: (frameId: string, data: FrameData) => void;
}

const initialFrame = createEmptyFrame();

export const useAppStore = create<AppState>((set, get) => ({
  frames: [initialFrame],
  currentFrameId: initialFrame.id,
  currentColor: '#FF004D',
  onlineUsers: [],
  localUser: null,
  editCount: 0,
  gifUrl: null,
  isPlaying: false,
  isGenerating: false,

  setFrames: (frames) => set({ frames }),
  setCurrentFrame: (id) => set({ currentFrameId: id }),
  setCurrentColor: (c) => set({ currentColor: c }),
  setLocalUser: (u) => set({ localUser: u }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  updatePixel: (frameId, x, y, color) => {
    set((state) => {
      const frames = state.frames.map((f) => {
        if (f.id === frameId) {
          const newData = f.data.map((row) => [...row]);
          newData[y][x] = color;
          return { ...f, data: newData };
        }
        return f;
      });
      return { frames };
    });
  },

  addFrame: () => {
    set((state) => {
      if (state.frames.length >= 50) return state;
      const newFrame = createEmptyFrame();
      return {
        frames: [...state.frames, newFrame],
        currentFrameId: newFrame.id
      };
    });
  },

  removeFrame: (id) => {
    set((state) => {
      if (state.frames.length <= 1) return state;
      const frames = state.frames.filter((f) => f.id !== id);
      let currentFrameId = state.currentFrameId;
      if (state.currentFrameId === id) {
        currentFrameId = frames[0].id;
      }
      return { frames, currentFrameId };
    });
  },

  reorderFrames: (from, to) => {
    set((state) => {
      const frames = [...state.frames];
      const [moved] = frames.splice(from, 1);
      frames.splice(to, 0, moved);
      return { frames };
    });
  },

  setFrameEditor: (frameId, userId) => {
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId ? { ...f, editorId: userId } : f
      )
    }));
  },

  setGifUrl: (url) => set({ gifUrl: url }),
  incrementEditCount: () => set((state) => ({ editCount: state.editCount + 1 })),
  setIsPlaying: (p) => set({ isPlaying: p }),
  setIsGenerating: (g) => set({ isGenerating: g }),

  replaceFrameData: (frameId, data) => {
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId ? { ...f, data } : f
      )
    }));
  }
}));
