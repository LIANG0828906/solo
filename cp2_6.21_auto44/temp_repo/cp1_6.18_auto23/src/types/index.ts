export interface SeedParams {
  spiralRadius: number;
  branchDensity: number;
  colorFlux: number;
}

export interface Preset {
  id: string;
  name: string;
  params: SeedParams;
}

export const PRESETS: Preset[] = [
  {
    id: 'spiral-nebula',
    name: '螺旋星云',
    params: { spiralRadius: 2.8, branchDensity: 7, colorFlux: 80 },
  },
  {
    id: 'coral-ray',
    name: '珊瑚射线',
    params: { spiralRadius: 1.5, branchDensity: 4, colorFlux: 30 },
  },
  {
    id: 'fern-frond',
    name: '蕨类羽叶',
    params: { spiralRadius: 2.2, branchDensity: 6, colorFlux: 60 },
  },
  {
    id: 'anemone-tentacle',
    name: '海葵触手',
    params: { spiralRadius: 1.8, branchDensity: 8, colorFlux: 90 },
  },
  {
    id: 'crystal-cluster',
    name: '水晶簇',
    params: { spiralRadius: 1.2, branchDensity: 3, colorFlux: 15 },
  },
];

export const DEFAULT_SEED: SeedParams = {
  spiralRadius: 2,
  branchDensity: 5,
  colorFlux: 50,
};

export const SEED_RANGES = {
  spiralRadius: { min: 1, max: 3 },
  branchDensity: { min: 3, max: 8 },
  colorFlux: { min: 0, max: 100 },
} as const;

export interface NodeData {
  id: number;
  basePosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  baseSize: number;
  currentSize: number;
  targetSize: number;
  baseColor: THREE.Color;
  currentColor: THREE.Color;
  targetColor: THREE.Color;
  scattered: boolean;
  scatterVelocity: THREE.Vector3;
  hovered: boolean;
  pulsePhase: number;
}
