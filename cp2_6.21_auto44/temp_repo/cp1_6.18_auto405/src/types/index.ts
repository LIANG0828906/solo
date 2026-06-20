export type SeedStatus = 'waiting' | 'growing' | 'complete' | 'fading';

export interface Particle {
  id: string;
  position: [number, number, number];
  originalPosition: [number, number, number];
  depth: number;
  parentId: string | null;
  phase: number;
  frequency: number;
  opacity: number;
  targetPosition: [number, number, number];
  growthProgress: number;
}

export interface Seed {
  id: string;
  position: [number, number, number];
  status: SeedStatus;
  startTime: number;
  growthStartTime: number;
  particles: Particle[];
  connections: [string, string][];
  breathPhase: number;
  breathCycle: number;
  fadeStartTime: number | null;
  maxDepth: number;
}

export interface GrowthParams {
  growthSpeed: number;
  branchDensity: number;
  startColor: string;
  endColor: string;
}

export interface GrowthState {
  seeds: Seed[];
  params: GrowthParams;
  time: number;
  totalParticles: number;
  seed: (position: [number, number, number]) => void;
  update: (delta: number) => void;
  reset: () => void;
  setParams: (params: Partial<GrowthParams>) => void;
}

export interface BurstParticle {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  life: number;
  maxLife: number;
}
