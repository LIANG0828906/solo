export type GrowthStage = 'idle' | 'sprouting' | 'branching' | 'blooming' | 'complete';

export interface Seed {
  id: string;
  name: string;
  author: string;
  description: string;
  createdAt: string;
  seedColor: string;
  seedColorEnd: string;
  petalColor: string;
  petalColorEnd: string;
}

export interface GrowthState {
  selectedSeedId: string | null;
  stage: GrowthStage;
  stageProgress: number;
  globalProgress: number;
  startTime: number | null;
  canvasPosition: { x: number; y: number } | null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'dirt' | 'pollen' | 'petal';
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export interface GrowthParams {
  sproutingDuration: number;
  branchingDuration: number;
  bloomingDuration: number;
  totalDuration: number;
}

export interface RenderState {
  seed: Seed | null;
  stage: GrowthStage;
  stageProgress: number;
  globalProgress: number;
  particles: Particle[];
  centerX: number;
  centerY: number;
  baseY: number;
}
