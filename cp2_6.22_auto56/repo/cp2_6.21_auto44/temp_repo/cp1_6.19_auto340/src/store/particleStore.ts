import { create } from 'zustand';
import type { Particle } from '../utils/physicsEngine';

export type FireworkType = 'circle' | 'spiral';

interface ParticleState {
  particles: Particle[];
  fireworkType: FireworkType;
  selectedColor: string;
  radius: number;
  speed: number;
  clientId: string;
  setParticles: (particles: Particle[]) => void;
  addParticles: (particles: Particle[]) => void;
  setFireworkType: (type: FireworkType) => void;
  setSelectedColor: (color: string) => void;
  setRadius: (radius: number) => void;
  setSpeed: (speed: number) => void;
  setClientId: (id: string) => void;
  resetParticles: () => void;
}

export const useParticleStore = create<ParticleState>((set) => ({
  particles: [],
  fireworkType: 'circle',
  selectedColor: '#FF5252',
  radius: 80,
  speed: 2,
  clientId: '',
  setParticles: (particles) => set({ particles }),
  addParticles: (newParticles) =>
    set((state) => ({ particles: [...state.particles, ...newParticles] })),
  setFireworkType: (type) => set({ fireworkType: type }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setRadius: (radius) => set({ radius }),
  setSpeed: (speed) => set({ speed }),
  setClientId: (id) => set({ clientId: id }),
  resetParticles: () => set({ particles: [] })
}));
