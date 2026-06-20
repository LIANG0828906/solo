import { create } from 'zustand';
import type { PipeData, CollisionPair } from './types';

export interface PipeStore {
  pipes: PipeData[];
  collisions: CollisionPair[];
  selectedPipe: PipeData | null;
  hoveredPipe: PipeData | null;
  showCollisionMarkers: boolean;
  setPipes: (pipes: PipeData[]) => void;
  addPipe: (pipe: PipeData) => void;
  removePipe: (id: string) => void;
  setCollisions: (collisions: CollisionPair[]) => void;
  setSelectedPipe: (pipe: PipeData | null) => void;
  setHoveredPipe: (pipe: PipeData | null) => void;
  setShowCollisionMarkers: (show: boolean) => void;
}

export const usePipeStore = create<PipeStore>((set) => ({
  pipes: [],
  collisions: [],
  selectedPipe: null,
  hoveredPipe: null,
  showCollisionMarkers: true,
  setPipes: (pipes) => set({ pipes }),
  addPipe: (pipe) => set((state) => ({ pipes: [...state.pipes, pipe] })),
  removePipe: (id) => set((state) => ({ pipes: state.pipes.filter((p) => p.id !== id) })),
  setCollisions: (collisions) => set({ collisions }),
  setSelectedPipe: (pipe) => set({ selectedPipe: pipe }),
  setHoveredPipe: (pipe) => set({ hoveredPipe: pipe }),
  setShowCollisionMarkers: (show) => set({ showCollisionMarkers: show }),
}));
