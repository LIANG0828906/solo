import { create } from 'zustand';

export type ThemeType = 'standard' | 'vintage' | 'modern';

interface PoemState {
  currentPoemIndex: number;
  printPosition: number;
  theme: ThemeType;
  speed: number;
  isPlaying: boolean;
  
  setCurrentPoemIndex: (index: number) => void;
  setPrintPosition: (position: number) => void;
  incrementPrintPosition: () => void;
  setTheme: (theme: ThemeType) => void;
  setSpeed: (speed: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  reset: () => void;
}

export const usePoemStore = create<PoemState>((set) => ({
  currentPoemIndex: 0,
  printPosition: 0,
  theme: 'standard',
  speed: 300,
  isPlaying: false,

  setCurrentPoemIndex: (index: number) => set({ currentPoemIndex: index, printPosition: 0, isPlaying: true }),
  setPrintPosition: (position: number) => set({ printPosition: position }),
  incrementPrintPosition: () => set((state) => ({ printPosition: state.printPosition + 1 })),
  setTheme: (theme: ThemeType) => set({ theme }),
  setSpeed: (speed: number) => set({ speed }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  reset: () => set({ printPosition: 0, isPlaying: true }),
}));

export const themeConfig: Record<ThemeType, {
  fontFamily: string;
  color: string;
  backgroundColor: string;
  lineHeight: number;
  letterSpacing: string;
}> = {
  standard: {
    fontFamily: "'Courier New', Courier, monospace",
    color: '#333333',
    backgroundColor: '#F5F0E2',
    lineHeight: 1.6,
    letterSpacing: '0.05em',
  },
  vintage: {
    fontFamily: 'Georgia, serif',
    color: '#4a2c2a',
    backgroundColor: '#F0E6D6',
    lineHeight: 1.8,
    letterSpacing: '0.02em',
  },
  modern: {
    fontFamily: 'Helvetica, Arial, sans-serif',
    color: '#1e1e1e',
    backgroundColor: '#FFFFFF',
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  },
};
