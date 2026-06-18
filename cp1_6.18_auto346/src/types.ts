export interface WindVector {
  direction: number;
  speed: number;
}

export interface ParticleState {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  hue: number;
  active: boolean;
}

export interface BuildingAttributes {
  id: string;
  gridX: number;
  gridZ: number;
  worldX: number;
  worldZ: number;
  height: number;
  type: 'gray' | 'green';
}

export interface GridData {
  rows: number;
  cols: number;
  cellSize: number;
  buildings: BuildingAttributes[];
}
