import { create } from 'zustand';
import type { EditorState, EditorActions, Particle, Keyframe, ToolType } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

const PRESET_COLORS = ['#FF6B6B', '#FFA726', '#FFEB3B', '#66BB6A', '#42A5F5', '#AB47BC', '#26C6DA'];

function randomRadius(): number {
  return Math.floor(Math.random() * 7) + 6;
}

function randomColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

type Store = EditorState & EditorActions;

export const useEditorStore = create<Store>((set, get) => ({
  particles: [],
  keyframes: [],
  selectedParticleId: null,
  activeTool: 'create',
  isPlaying: false,
  currentFrame: 0,
  totalFrames: 120,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  isPreviewMode: false,
  canvasWidth: 800,
  canvasHeight: 600,

  setActiveTool: (tool: ToolType) => set({ activeTool: tool, selectedParticleId: null }),

  addParticle: (x: number, y: number) => {
    const particle: Particle = {
      id: generateId(),
      x,
      y,
      radius: randomRadius(),
      color: randomColor(),
      opacity: 0.8,
      glowEnabled: false,
    };
    set((state) => ({ particles: [...state.particles, particle] }));
  },

  deleteParticle: (id: string) =>
    set((state) => ({
      particles: state.particles.filter((p) => p.id !== id),
      selectedParticleId: state.selectedParticleId === id ? null : state.selectedParticleId,
    })),

  updateParticle: (id: string, updates: Partial<Omit<Particle, 'id'>>) =>
    set((state) => ({
      particles: state.particles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  selectParticle: (id: string | null) => set({ selectedParticleId: id }),

  moveParticle: (id: string, x: number, y: number) =>
    set((state) => ({
      particles: state.particles.map((p) => (p.id === id ? { ...p, x, y } : p)),
    })),

  addKeyframe: () => {
    const state = get();
    const existingIndex = state.keyframes.findIndex(
      (kf) => kf.frameIndex === state.currentFrame
    );
    const keyframe: Keyframe = {
      id: generateId(),
      frameIndex: state.currentFrame,
      particles: JSON.parse(JSON.stringify(state.particles)),
    };
    if (existingIndex >= 0) {
      set((state) => ({
        keyframes: state.keyframes.map((kf, i) =>
          i === existingIndex ? keyframe : kf
        ),
      }));
    } else {
      set((state) => ({
        keyframes: [...state.keyframes, keyframe].sort(
          (a, b) => a.frameIndex - b.frameIndex
        ),
      }));
    }
  },

  deleteKeyframe: (id: string) =>
    set((state) => ({
      keyframes: state.keyframes.filter((kf) => kf.id !== id),
    })),

  setCurrentFrame: (frame: number) => set({ currentFrame: Math.max(0, Math.min(frame, get().totalFrames - 1)) }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setZoom: (zoom: number) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  setPanOffset: (offset: { x: number; y: number }) => set({ panOffset: offset }),

  setIsPreviewMode: (preview: boolean) => set({ isPreviewMode: preview }),

  loadKeyframeToCanvas: (frameIndex: number) => {
    const state = get();
    const kf = state.keyframes.find((k) => k.frameIndex === frameIndex);
    if (kf) {
      set({ particles: JSON.parse(JSON.stringify(kf.particles)) });
    }
  },
}));
