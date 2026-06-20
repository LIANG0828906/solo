import { create } from 'zustand';
import type { Artifact } from '../types';

interface AppState {
  selectedEventId: string | null;
  isLoading: boolean;
  artifactData: Artifact | null;
  showInfoCard: boolean;
  isTransitioning: boolean;
  setSelectedEvent: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setArtifactData: (data: Artifact | null) => void;
  setShowInfoCard: (show: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  resetState: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedEventId: null,
  isLoading: false,
  artifactData: null,
  showInfoCard: false,
  isTransitioning: false,

  setSelectedEvent: (id) => set({ selectedEventId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setArtifactData: (data) => set({ artifactData: data }),
  setShowInfoCard: (show) => set({ showInfoCard: show }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

  resetState: () => set({
    selectedEventId: null,
    isLoading: false,
    artifactData: null,
    showInfoCard: false,
    isTransitioning: false
  })
}));
