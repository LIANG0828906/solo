
export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface GridCell {
  i: number;
  j: number;
  k: number;
  density: number;
  color: string;
}

export interface CurrentParams {
  currentSpeed: number;
  vortexStrength: number;
  releaseRate: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface HeatmapGrid extends GridCell {
  worldX: number;
  worldY: number;
  worldZ: number;
  isHotspot: boolean;
}
