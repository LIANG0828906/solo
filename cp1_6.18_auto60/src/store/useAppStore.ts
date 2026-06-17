import { create } from 'zustand';
import type { AppStore } from '../types';

export const useAppStore = create<AppStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  isPlaying: true,
  speed: 1,
  isLoading: false,

  setNodes: (nodes: CodeNode[]) => set({ nodes }),
  setEdges: (edges: CodeEdge[]) => set({ edges }),
  setSelectedNode: (node: CodeNode | null) => set({ selectedNode: node }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setSpeed: (speed: number) => set({ speed }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  resetAnimation: () => set({ isPlaying: true, speed: 1 }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));
