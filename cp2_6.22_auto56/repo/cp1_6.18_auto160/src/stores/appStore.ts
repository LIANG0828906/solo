import { create } from 'zustand';
import type {
  EmotionType,
  ParticleConfig,
  EmotionSegment,
  EmotionAnalysisResult
} from '../types';
import {
  DEFAULT_PARTICLE_CONFIG,
  DEFAULT_EMOTION_WEIGHTS,
  EMOTION_ORDER
} from '../types';

interface CameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

interface AppState {
  currentText: string;
  emotionWeights: Record<EmotionType, number>;
  emotionSegments: EmotionSegment[];
  particleConfig: ParticleConfig;
  selectedEmotion: EmotionType | null;
  hoveredSegment: EmotionSegment | null;
  hoveredEmotion: EmotionType | null;
  lastAnalysis: EmotionAnalysisResult | null;
  cameraState: CameraState;
  burstPending: { origin: { x: number; y: number; z: number } } | null;
  actions: {
    setText: (t: string) => void;
    setAnalysisResult: (result: EmotionAnalysisResult) => void;
    setSelectedEmotion: (e: EmotionType | null) => void;
    setHoveredSegment: (s: EmotionSegment | null) => void;
    setHoveredEmotion: (e: EmotionType | null) => void;
    setCameraState: (state: Partial<CameraState>) => void;
    resetCamera: () => void;
    captureScreenshot: () => void;
    toggleFullscreen: () => void;
    reanalyze: () => void;
    requestBurst: (origin: { x: number; y: number; z: number }) => void;
    consumeBurst: () => void;
  };
}

const DEFAULT_CAMERA: CameraState = {
  position: { x: 0, y: 2, z: 16 },
  target: { x: 0, y: 0, z: 0 }
};

export const useAppStore = create<AppState>((set, get) => ({
  currentText: '',
  emotionWeights: { ...DEFAULT_EMOTION_WEIGHTS },
  emotionSegments: [],
  particleConfig: { ...DEFAULT_PARTICLE_CONFIG },
  selectedEmotion: null,
  hoveredSegment: null,
  hoveredEmotion: null,
  lastAnalysis: null,
  cameraState: { ...DEFAULT_CAMERA },
  burstPending: null,

  actions: {
    setText: (t: string) => {
      set({ currentText: t });
    },

    setAnalysisResult: (result: EmotionAnalysisResult) => {
      set({
        emotionWeights: { ...result.weights },
        emotionSegments: [...result.segments],
        lastAnalysis: result
      });
    },

    setSelectedEmotion: (e: EmotionType | null) => {
      const current = get().selectedEmotion;
      const next = current === e ? null : e;
      set({ selectedEmotion: next });
    },

    setHoveredSegment: (s: EmotionSegment | null) => {
      set({ hoveredSegment: s });
    },

    setHoveredEmotion: (e: EmotionType | null) => {
      set({ hoveredEmotion: e });
    },

    setCameraState: (state: Partial<CameraState>) => {
      const prev = get().cameraState;
      set({
        cameraState: {
          position: state.position ?? prev.position,
          target: state.target ?? prev.target
        }
      });
    },

    resetCamera: () => {
      set({
        cameraState: { ...DEFAULT_CAMERA }
      });
    },

    captureScreenshot: () => {
    },

    toggleFullscreen: () => {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        el.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    },

    reanalyze: () => {
      const text = get().currentText;
      if (!text.trim()) return;
    },

    requestBurst: (origin: { x: number; y: number; z: number }) => {
      set({ burstPending: { origin } });
    },

    consumeBurst: () => {
      set({ burstPending: null });
    }
  }
}));

export function getTotalWeight(weights: Record<EmotionType, number>): number {
  return EMOTION_ORDER.reduce((sum, e) => sum + weights[e], 0);
}

export function getEmotionPercentages(
  weights: Record<EmotionType, number>
): Record<EmotionType, number> {
  const total = getTotalWeight(weights);
  if (total === 0) {
    return { joy: 25, sadness: 25, anger: 25, calm: 25 };
  }
  const result: Record<string, number> = {};
  for (const e of EMOTION_ORDER) {
    result[e] = (weights[e] / total) * 100;
  }
  return result as Record<EmotionType, number>;
}
