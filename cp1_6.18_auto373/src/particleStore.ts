import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Particle {
  id: string;
  position: { x: number; y: number; z: number };
  basePosition: { x: number; y: number; z: number };
  color: { h: number; s: number; l: number };
  size: number;
  opacity: number;
  phaseOffset: number;
  createdAt: number;
}

interface ParticleStore {
  particles: Particle[];
  maxParticles: number;
  colorOffset: number;
  rotationSpeed: number;
  addParticles: (particles: Particle[]) => void;
  setMaxParticles: (n: number) => void;
  setColorOffset: (n: number) => void;
  setRotationSpeed: (n: number) => void;
  reset: () => void;
}

export const useParticleStore = create<ParticleStore>((set, get) => ({
  particles: [],
  maxParticles: 2000,
  colorOffset: 0,
  rotationSpeed: 0.1,

  addParticles: (newParticles: Particle[]) => {
    set((state) => {
      const combined = [...state.particles, ...newParticles];
      if (combined.length > state.maxParticles) {
        const overflow = combined.length - state.maxParticles;
        return { particles: combined.slice(overflow) };
      }
      return { particles: combined };
    });
  },

  setMaxParticles: (n: number) => {
    set((state) => {
      const particles = state.particles.length > n
        ? state.particles.slice(state.particles.length - n)
        : state.particles;
      return { maxParticles: n, particles };
    });
  },

  setColorOffset: (n: number) => set({ colorOffset: n }),

  setRotationSpeed: (n: number) => set({ rotationSpeed: n }),

  reset: () => set({ particles: [] }),
}));

export function createParticleBatch(
  centerX: number,
  centerY: number,
  speed: number,
  count: number
): Particle[] {
  const particles: Particle[] = [];
  const now = performance.now();

  let hueRange: [number, number];
  if (speed < 50) {
    hueRange = [180, 240];
  } else if (speed <= 150) {
    hueRange = [30, 120];
  } else {
    hueRange = [0, 30];
  }

  const normalizedSpeed = Math.min(speed / 200, 1);
  const baseOpacity = 0.3 + normalizedSpeed * 0.5;

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * 15;

    const x = centerX + r * Math.sin(phi) * Math.cos(theta);
    const y = centerY + r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    const hue = hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]);

    particles.push({
      id: uuidv4(),
      position: { x, y, z },
      basePosition: { x, y, z },
      color: { h: hue, s: 80, l: 60 },
      size: 1 + Math.random() * 3,
      opacity: baseOpacity,
      phaseOffset: Math.random() * Math.PI * 2,
      createdAt: now,
    });
  }

  return particles;
}
