export interface BuildingBlock {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  selected: boolean;
}

export interface WindParams {
  direction: number;
  speed: number;
}

export interface VelocityGrid {
  sizeX: number;
  sizeZ: number;
  minX: number;
  minZ: number;
  step: number;
  velocities: { x: number; z: number; magnitude: number }[][];
}

export interface Streamline {
  points: { x: number; z: number }[];
  velocity: number;
}

export interface BuildingWindStats {
  buildingId: string;
  windwardVelocity: number;
  leewardVelocity: number;
}

export interface SimulationResult {
  velocityGrid: VelocityGrid;
  streamlines: Streamline[];
  maxVelocityRatio: number;
  avgVelocity: number;
  buildingStats: BuildingWindStats[];
  timestamp: number;
}

export interface SceneSnapshot {
  version: string;
  timestamp: number;
  buildings: BuildingBlock[];
  windParams: WindParams;
  simulationResult?: SimulationResult;
}
