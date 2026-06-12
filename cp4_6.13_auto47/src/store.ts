import { create } from 'zustand';
import type { Particle, Vector3, FieldConfig, TrailData, Attractor, Repulsor } from './types';

const MAX_ATTRACTORS = 3;
const MAX_REPULSORS = 2;
const TRAIL_LENGTH = 200;
const PARTICLE_RANGE = 15;

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * PARTICLE_RANGE * 2;
    const y = (Math.random() - 0.5) * PARTICLE_RANGE * 2;
    const z = (Math.random() - 0.5) * PARTICLE_RANGE * 2;
    const dist = Math.sqrt(x * x + y * y + z * z);
    const maxDist = PARTICLE_RANGE * Math.sqrt(3);
    const hue = 0.7 - (dist / maxDist) * 0.7;
    particles.push({
      id: i,
      position: { x, y, z },
      velocity: { x: 0, y: 0, z: 0 },
      color: { h: hue, s: 0.8, l: 0.6 },
      initialDist: dist,
    });
  }
  return particles;
}

function generateTrails(particles: Particle[]): TrailData[] {
  return particles.map((p) => ({
    particleId: p.id,
    positions: [{ ...p.position }],
    color: { ...p.color },
  }));
}

interface ParticleStore {
  particles: Particle[];
  trails: TrailData[];
  fieldConfig: FieldConfig;
  isRunning: boolean;
  particleCount: number;
  hoveredTrailId: number | null;
  fps: number;

  setVortexStrength: (strength: number) => void;

  addAttractor: () => void;
  removeAttractor: (id: number) => void;
  setAttractorPosition: (id: number, axis: keyof Vector3, value: number) => void;
  setAttractorStrength: (id: number, strength: number) => void;

  addRepulsor: () => void;
  removeRepulsor: (id: number) => void;
  setRepulsorPosition: (id: number, axis: keyof Vector3, value: number) => void;
  setRepulsorRadius: (id: number, radius: number) => void;

  setParticleCount: (count: number) => void;
  setIsRunning: (running: boolean) => void;
  reset: () => void;
  setHoveredTrailId: (id: number | null) => void;
  setFps: (fps: number) => void;

  setParticlesAndTrails: (particles: Particle[], trails: TrailData[]) => void;
}

const initialFieldConfig: FieldConfig = {
  vortexStrength: 1.0,
  attractors: [
    { id: 1, position: { x: 5, y: 0, z: 0 }, strength: 2 },
  ],
  repulsors: [
    { id: 1, position: { x: -5, y: 0, z: 0 }, radius: 2 },
  ],
};

let attractorIdCounter = 2;
let repulsorIdCounter = 2;

export const useParticleStore = create<ParticleStore>((set, get) => {
  const initialParticles = generateParticles(500);
  const initialTrails = generateTrails(initialParticles);

  return {
    particles: initialParticles,
    trails: initialTrails,
    fieldConfig: initialFieldConfig,
    isRunning: true,
    particleCount: 500,
    hoveredTrailId: null,
    fps: 0,

    setVortexStrength: (strength) =>
      set((s) => ({
        fieldConfig: { ...s.fieldConfig, vortexStrength: strength },
      })),

    addAttractor: () => {
      const { fieldConfig } = get();
      if (fieldConfig.attractors.length >= MAX_ATTRACTORS) return;
      const newAttractor: Attractor = {
        id: attractorIdCounter++,
        position: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10,
        },
        strength: 2,
      };
      set((s) => ({
        fieldConfig: {
          ...s.fieldConfig,
          attractors: [...s.fieldConfig.attractors, newAttractor],
        },
      }));
    },

    removeAttractor: (id) =>
      set((s) => ({
        fieldConfig: {
          ...s.fieldConfig,
          attractors: s.fieldConfig.attractors.filter((a) => a.id !== id),
        },
      })),

    setAttractorPosition: (id, axis, value) =>
      set((s) => ({
        fieldConfig: {
          ...s.fieldConfig,
          attractors: s.fieldConfig.attractors.map((a) =>
            a.id === id
              ? { ...a, position: { ...a.position, [axis]: value } }
              : a
          ),
        },
      })),

    setAttractorStrength: (id, strength) =>
      set((s) => ({
        fieldConfig: {
          ...s.fieldConfig,
          attractors: s.fieldConfig.attractors.map((a) =>
            a.id === id ? { ...a, strength } : a
          ),
        },
      })),

    addRepulsor: () => {
      const { fieldConfig } = get();
      if (fieldConfig.repulsors.length >= MAX_REPULSORS) return;
      const newRepulsor: Repulsor = {
        id: repulsorIdCounter++,
        position: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10,
        },
        radius: 2,
      };
      set((s) => ({
        fieldConfig: {
          ...s.fieldConfig,
          repulsors: [...s.fieldConfig.repulsors, newRepulsor],
        },
      }));
    },

    removeRepulsor: (id) =>
      set((s) => ({
        fieldConfig: {
          ...s.fieldConfig,
          repulsors: s.fieldConfig.repulsors.filter((r) => r.id !== id),
        },
      })),

    setRepulsorPosition: (id, axis, value) =>
      set((s) => ({
        fieldConfig: {
          ...s.fieldConfig,
          repulsors: s.fieldConfig.repulsors.map((r) =>
            r.id === id
              ? { ...r, position: { ...r.position, [axis]: value } }
              : r
          ),
        },
      })),

    setRepulsorRadius: (id, radius) =>
      set((s) => ({
        fieldConfig: {
          ...s.fieldConfig,
          repulsors: s.fieldConfig.repulsors.map((r) =>
            r.id === id ? { ...r, radius } : r
          ),
        },
      })),

    setParticleCount: (count) => {
      const newParticles = generateParticles(count);
      const newTrails = generateTrails(newParticles);
      set({ particles: newParticles, trails: newTrails, particleCount: count });
    },

    setIsRunning: (running) => set({ isRunning: running }),

    reset: () => {
      const { particleCount } = get();
      const newParticles = generateParticles(particleCount);
      const newTrails = generateTrails(newParticles);
      set({ particles: newParticles, trails: newTrails });
    },

    setHoveredTrailId: (id) => set({ hoveredTrailId: id }),

    setFps: (fps) => set({ fps }),

    setParticlesAndTrails: (particles, trails) =>
      set({ particles, trails }),
  };
});

export { TRAIL_LENGTH, MAX_ATTRACTORS, MAX_REPULSORS };
