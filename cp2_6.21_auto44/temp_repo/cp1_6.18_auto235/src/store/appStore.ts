import { create } from 'zustand';
import axios from 'axios';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type ColorTheme = 'cool' | 'warm' | 'nature';

export interface AppState {
  skeleton: Point2D[];
  latticeNodes: Point3D[];
  latticeEdges: [number, number][];
  rotationSpeed: number;
  glowIntensity: number;
  colorTheme: ColorTheme;
  isGenerating: boolean;
  isGenerated: boolean;
  error: string | null;

  setSkeleton: (pts: Point2D[]) => void;
  setLattice: (nodes: Point3D[], edges: [number, number][]) => void;
  setRotationSpeed: (v: number) => void;
  setGlowIntensity: (v: number) => void;
  setColorTheme: (t: ColorTheme) => void;
  setGenerating: (v: boolean) => void;
  setError: (e: string | null) => void;
  generateLattice: () => Promise<void>;
  resetCanvas: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  skeleton: [],
  latticeNodes: [],
  latticeEdges: [],
  rotationSpeed: 0.005,
  glowIntensity: 0.6,
  colorTheme: 'cool',
  isGenerating: false,
  isGenerated: false,
  error: null,

  setSkeleton: (pts) => set({ skeleton: pts }),
  setLattice: (nodes, edges) => set({ latticeNodes: nodes, latticeEdges: edges }),
  setRotationSpeed: (v) => set({ rotationSpeed: v }),
  setGlowIntensity: (v) => set({ glowIntensity: v }),
  setColorTheme: (t) => set({ colorTheme: t }),
  setGenerating: (v) => set({ isGenerating: v }),
  setError: (e) => set({ error: e }),

  generateLattice: async () => {
    const { skeleton } = get();
    if (skeleton.length < 2) {
      set({ error: '请先绘制至少2个点的轮廓' });
      return;
    }

    set({ isGenerating: true, error: null, isGenerated: false });

    try {
      const response = await axios.post('/api/generate', { skeleton });
      const { nodes, edges } = response.data;
      set({
        latticeNodes: nodes,
        latticeEdges: edges,
        isGenerated: true,
        isGenerating: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || err.message || '生成失败',
        isGenerating: false,
      });
    }
  },

  resetCanvas: () =>
    set({
      skeleton: [],
      latticeNodes: [],
      latticeEdges: [],
      isGenerated: false,
      error: null,
    }),
}));
