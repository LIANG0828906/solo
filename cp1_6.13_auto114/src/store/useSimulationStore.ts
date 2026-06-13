import { create } from 'zustand';
import type { Vec2, GravitySource } from '@/utils/physicsEngine';

interface Particle {
  id: string;
  position: Vec2;
  velocity: Vec2;
  trajectory: Array<{ x: number; z: number; speed: number; time: number }>;
  startTime: number;
  active: boolean;
}

interface SimulationState {
  gravitySources: GravitySource[];
  particles: Particle[];
  isRunning: boolean;
  speedScale: number;
  showPotentialGrid: boolean;
  showFieldIndicators: boolean;
  panelCollapsed: boolean;
  selectedSourceId: string | null;
  particleStartPos: Vec2 | null;
  playbackTime: number;
  maxTrajectoryTime: number;
  addGravitySource: (pos: Vec2) => void;
  removeGravitySource: (id: string) => void;
  updateSourceMass: (id: string, mass: number) => void;
  updateSourcePosition: (id: string, pos: Vec2) => void;
  setSelectedSourceId: (id: string | null) => void;
  releaseParticle: () => void;
  updateParticle: (id: string, pos: Vec2, vel: Vec2) => void;
  deactivateParticle: (id: string) => void;
  toggleRunning: () => void;
  setSpeedScale: (scale: number) => void;
  togglePotentialGrid: () => void;
  toggleFieldIndicators: () => void;
  togglePanel: () => void;
  setParticleStartPos: (pos: Vec2 | null) => void;
  setPlaybackTime: (t: number) => void;
  setMaxTrajectoryTime: (t: number) => void;
  reset: () => void;
}

const useSimulationStore = create<SimulationState>((set) => ({
  gravitySources: [],
  particles: [],
  isRunning: false,
  speedScale: 1,
  showPotentialGrid: false,
  showFieldIndicators: true,
  panelCollapsed: false,
  selectedSourceId: null,
  particleStartPos: null,
  playbackTime: 0,
  maxTrajectoryTime: 0,

  addGravitySource: (pos) =>
    set((state) => ({
      gravitySources: [
        ...state.gravitySources,
        { id: crypto.randomUUID(), position: pos, mass: 5 },
      ],
    })),

  removeGravitySource: (id) =>
    set((state) => ({
      gravitySources: state.gravitySources.filter((s) => s.id !== id),
    })),

  updateSourceMass: (id, mass) =>
    set((state) => ({
      gravitySources: state.gravitySources.map((s) =>
        s.id === id ? { ...s, mass: Math.round(Math.max(-10, Math.min(10, mass))) } : s
      ),
    })),

  updateSourcePosition: (id, pos) =>
    set((state) => ({
      gravitySources: state.gravitySources.map((s) =>
        s.id === id ? { ...s, position: pos } : s
      ),
    })),

  setSelectedSourceId: (id) => set({ selectedSourceId: id }),

  releaseParticle: () =>
    set((state) => {
      if (state.particles.filter((p) => p.active).length >= 3) return state;
      const pos = state.particleStartPos ?? [0, 0];
      return {
        particles: [
          ...state.particles,
          {
            id: crypto.randomUUID(),
            position: pos,
            velocity: [0, 0],
            trajectory: [],
            startTime: performance.now(),
            active: true,
          },
        ],
        isRunning: true,
        particleStartPos: null,
      };
    }),

  updateParticle: (id, pos, vel) =>
    set((state) => ({
      particles: state.particles.map((p) => {
        if (p.id !== id) return p;
        const speed = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1]);
        const time = performance.now() - p.startTime;
        return {
          ...p,
          position: pos,
          velocity: vel,
          trajectory: [...p.trajectory, { x: pos[0], z: pos[1], speed, time }],
        };
      }),
    })),

  deactivateParticle: (id) =>
    set((state) => ({
      particles: state.particles.map((p) =>
        p.id === id ? { ...p, active: false } : p
      ),
    })),

  toggleRunning: () =>
    set((state) => ({ isRunning: !state.isRunning })),

  setSpeedScale: (scale) =>
    set({ speedScale: Math.max(0.1, Math.min(5, scale)) }),

  togglePotentialGrid: () =>
    set((state) => ({ showPotentialGrid: !state.showPotentialGrid })),

  toggleFieldIndicators: () =>
    set((state) => ({ showFieldIndicators: !state.showFieldIndicators })),

  togglePanel: () =>
    set((state) => ({ panelCollapsed: !state.panelCollapsed })),

  setParticleStartPos: (pos) => set({ particleStartPos: pos }),

  setPlaybackTime: (t) => set({ playbackTime: t }),

  setMaxTrajectoryTime: (t) => set({ maxTrajectoryTime: t }),

  reset: () =>
    set({
      particles: [],
      isRunning: false,
      playbackTime: 0,
      maxTrajectoryTime: 0,
    }),
}));

export default useSimulationStore;
export type { Particle };
