import { create } from 'zustand';

export interface StormConfig {
  windStrength: number;
  showTrails: boolean;
}

export interface StormState extends StormConfig {
  activeParticles: number;
  setWindStrength: (strength: number) => void;
  setShowTrails: (show: boolean) => void;
  setActiveParticles: (count: number) => void;
}

export const useStormStore = create<StormState>((set) => ({
  windStrength: 5,
  showTrails: false,
  activeParticles: 0,
  setWindStrength: (strength) => set({ windStrength: strength }),
  setShowTrails: (show) => set({ showTrails: show }),
  setActiveParticles: (count) => set({ activeParticles: count }),
}));
