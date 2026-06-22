import { create } from 'zustand';

export type Theme = 'fire' | 'ice' | 'sand' | 'petal';
export type AnimationState = 'idle' | 'playing' | 'paused' | 'finished';

interface EditorStore {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  theme: Theme;
  particleSize: number;
  dissolveSpeed: number;
  directionRandomness: number;
  animationState: AnimationState;
  playbackRate: number;
  progress: number;
  remainingTime: number;
  exportProgress: number;
  isExporting: boolean;

  setText: (text: string) => void;
  setTheme: (theme: Theme) => void;
  setParticleSize: (size: number) => void;
  setDissolveSpeed: (speed: number) => void;
  setDirectionRandomness: (randomness: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setPlaybackRate: (rate: number) => void;
  setProgress: (progress: number) => void;
  setExportState: (isExporting: boolean, progress: number) => void;
  exportJSON: () => void;
}

const countTextLength = (text: string): number => {
  let count = 0;
  for (const char of text) {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      count += 2;
    } else {
      count += 1;
    }
  }
  return count;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  text: '文字粒子',
  fontSize: 80,
  fontWeight: 'bold',
  fontStyle: 'normal',
  theme: 'fire',
  particleSize: 4,
  dissolveSpeed: 2,
  directionRandomness: 50,
  animationState: 'idle',
  playbackRate: 1,
  progress: 0,
  remainingTime: 0,
  exportProgress: 0,
  isExporting: false,

  setText: (text: string) => {
    const length = countTextLength(text);
    if (length > 40) {
      console.warn('文字长度超出限制：最多20个中文或40个英文字符');
      return;
    }
    set({ text });
  },

  setTheme: (theme: Theme) => set({ theme }),

  setParticleSize: (size: number) => set({ particleSize: clamp(size, 2, 8) }),

  setDissolveSpeed: (speed: number) => set({ dissolveSpeed: clamp(speed, 0.5, 5) }),

  setDirectionRandomness: (randomness: number) => set({ directionRandomness: clamp(randomness, 0, 100) }),

  play: () => set({ animationState: 'playing' }),

  pause: () => set({ animationState: 'paused' }),

  reset: () => set({
    animationState: 'idle',
    progress: 0,
    remainingTime: 0,
  }),

  setPlaybackRate: (rate: number) => set({ playbackRate: clamp(rate, 0.5, 3) }),

  setProgress: (progress: number) => set({ progress: clamp(progress, 0, 1) }),

  setExportState: (isExporting: boolean, progress: number) => set({
    isExporting,
    exportProgress: clamp(progress, 0, 1),
  }),

  exportJSON: () => {
    const state = get();
    const config = {
      text: state.text,
      fontSize: state.fontSize,
      fontWeight: state.fontWeight,
      fontStyle: state.fontStyle,
      theme: state.theme,
      particleSize: state.particleSize,
      dissolveSpeed: state.dissolveSpeed,
      directionRandomness: state.directionRandomness,
      playbackRate: state.playbackRate,
    };
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `particle-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));
