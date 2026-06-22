import { create } from 'zustand';
import { ThemeType, ParticleParams, AnimationState, TextConfig, ExportConfig } from '../types';
import { THEMES } from '../themes';

interface EditorState {
  textConfig: TextConfig;
  theme: ThemeType;
  particleParams: ParticleParams;
  animationState: AnimationState;
  exportProgress: number;
  isExporting: boolean;

  setText: (text: string) => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: 'normal' | 'bold') => void;
  setFontStyle: (style: 'normal' | 'italic') => void;
  setTheme: (theme: ThemeType) => void;
  setParticleSize: (size: number) => void;
  setDissipateSpeed: (speed: number) => void;
  setDirectionRandomness: (randomness: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  setProgress: (progress: number) => void;
  setRemainingTime: (time: number) => void;
  setSpeedMultiplier: (multiplier: number) => void;
  setTriggerMode: (mode: 'click' | 'auto') => void;
  setExportProgress: (progress: number) => void;
  setIsExporting: (isExporting: boolean) => void;
  resetAnimation: () => void;
  togglePlay: () => void;
  generateExportConfig: () => ExportConfig;
  loadExportConfig: (config: ExportConfig) => void;
}

const validateText = (text: string): string => {
  let count = 0;
  let result = '';
  for (const char of text) {
    const charCode = char.charCodeAt(0);
    const isChinese = charCode >= 0x4e00 && charCode <= 0x9fff;
    count += isChinese ? 2 : 1;
    if (count > 40) break;
    result += char;
  }
  return result;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  textConfig: {
    text: '粒子消散',
    fontSize: 80,
    fontWeight: 'bold',
    fontStyle: 'normal'
  },
  theme: 'fire',
  particleParams: {
    particleSize: 4,
    dissipateSpeed: 2,
    directionRandomness: 50
  },
  animationState: {
    isPlaying: false,
    isPaused: false,
    progress: 0,
    remainingTime: 0,
    speedMultiplier: 1,
    triggerMode: 'click'
  },
  exportProgress: 0,
  isExporting: false,

  setText: (text) => set((state) => ({
    textConfig: { ...state.textConfig, text: validateText(text) }
  })),
  setFontSize: (size) => set((state) => ({
    textConfig: { ...state.textConfig, fontSize: size }
  })),
  setFontWeight: (weight) => set((state) => ({
    textConfig: { ...state.textConfig, fontWeight: weight }
  })),
  setFontStyle: (style) => set((state) => ({
    textConfig: { ...state.textConfig, fontStyle: style }
  })),
  setTheme: (theme) => set({ theme }),
  setParticleSize: (size) => set((state) => ({
    particleParams: { ...state.particleParams, particleSize: size }
  })),
  setDissipateSpeed: (speed) => set((state) => ({
    particleParams: { ...state.particleParams, dissipateSpeed: speed }
  })),
  setDirectionRandomness: (randomness) => set((state) => ({
    particleParams: { ...state.particleParams, directionRandomness: randomness }
  })),
  setIsPlaying: (isPlaying) => set((state) => ({
    animationState: { ...state.animationState, isPlaying }
  })),
  setIsPaused: (isPaused) => set((state) => ({
    animationState: { ...state.animationState, isPaused }
  })),
  setProgress: (progress) => set((state) => ({
    animationState: { ...state.animationState, progress: Math.max(0, Math.min(1, progress)) }
  })),
  setRemainingTime: (remainingTime) => set((state) => ({
    animationState: { ...state.animationState, remainingTime: Math.max(0, remainingTime) }
  })),
  setSpeedMultiplier: (speedMultiplier) => set((state) => ({
    animationState: { ...state.animationState, speedMultiplier: Math.max(0.5, Math.min(3, speedMultiplier)) }
  })),
  setTriggerMode: (triggerMode) => set((state) => ({
    animationState: { ...state.animationState, triggerMode }
  })),
  setExportProgress: (exportProgress) => set({ exportProgress: Math.max(0, Math.min(100, exportProgress)) }),
  setIsExporting: (isExporting) => set({ isExporting }),
  resetAnimation: () => set((state) => ({
    animationState: {
      ...state.animationState,
      isPlaying: false,
      isPaused: false,
      progress: 0,
      remainingTime: state.particleParams.dissipateSpeed
    }
  })),
  togglePlay: () => set((state) => ({
    animationState: {
      ...state.animationState,
      isPlaying: !state.animationState.isPlaying,
      isPaused: false
    }
  })),
  generateExportConfig: (): ExportConfig => {
    const state = get();
    return {
      textConfig: { ...state.textConfig },
      theme: state.theme,
      particleParams: { ...state.particleParams },
      animationConfig: {
        speedMultiplier: state.animationState.speedMultiplier,
        triggerMode: state.animationState.triggerMode
      },
      timestamp: Date.now(),
      version: '1.0.0'
    };
  },
  loadExportConfig: (config: ExportConfig) => {
    if (config.version !== '1.0.0') {
      console.warn('配置版本不兼容，部分设置可能无法加载');
    }
    set({
      textConfig: { ...config.textConfig },
      theme: config.theme,
      particleParams: { ...config.particleParams },
      animationState: {
        ...get().animationState,
        speedMultiplier: config.animationConfig.speedMultiplier,
        triggerMode: config.animationConfig.triggerMode
      }
    });
  }
}));
