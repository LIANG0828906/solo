import { create } from 'zustand';

export type PresetType = 'laminar' | 'vortex' | 'turbulent';

export interface ParticleData {
  id: number;
  position: Float32Array;
  velocity: Float32Array;
  trail: Float32Array[];
  alive: boolean;
}

export interface SimulationSnapshot {
  particles: ParticleData[];
  version: number;
}

interface ParticleState {
  particleCount: number;
  vortexStrength: number;
  viscosity: number;
  initialVelocity: { x: number; y: number };
  selectedParticleId: number | null;
  activePreset: PresetType | null;
  presetTransitioning: boolean;

  setParticleCount: (n: number) => void;
  setVortexStrength: (n: number) => void;
  setViscosity: (n: number) => void;
  setInitialVelocity: (x: number, y: number) => void;
  selectParticle: (id: number | null) => void;
  removeSelectedParticle: () => void;
  applyPreset: (preset: PresetType) => void;
  setPresetTransitioning: (v: boolean) => void;
}

export const useParticleStore = create<ParticleState>((set) => ({
  particleCount: 1000,
  vortexStrength: 2.5,
  viscosity: 0.6,
  initialVelocity: { x: 1.5, y: 0.2 },
  selectedParticleId: null,
  activePreset: null,
  presetTransitioning: false,

  setParticleCount: (n) => set({ particleCount: Math.round(n) }),
  setVortexStrength: (n) => set({ vortexStrength: n }),
  setViscosity: (n) => set({ viscosity: n }),
  setInitialVelocity: (x, y) => set({ initialVelocity: { x, y } }),
  selectParticle: (id) => set({ selectedParticleId: id }),
  removeSelectedParticle: () => set({ selectedParticleId: null }),
  applyPreset: (preset) => {
    const presets: Record<PresetType, Partial<ParticleState>> = {
      laminar: {
        particleCount: 1000,
        vortexStrength: 0.2,
        viscosity: 0.4,
        initialVelocity: { x: 2.5, y: 0 },
      },
      vortex: {
        particleCount: 1500,
        vortexStrength: 7.5,
        viscosity: 0.8,
        initialVelocity: { x: 0.5, y: 0.5 },
      },
      turbulent: {
        particleCount: 2000,
        vortexStrength: 5.0,
        viscosity: 1.2,
        initialVelocity: { x: 1.0, y: 1.0 },
      },
    };
    const cfg = presets[preset];
    set({ ...cfg, activePreset: preset, presetTransitioning: true });
    setTimeout(() => set({ presetTransitioning: false }), 1500);
  },
  setPresetTransitioning: (v) => set({ presetTransitioning: v }),
}));
