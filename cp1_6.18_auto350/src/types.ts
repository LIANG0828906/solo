export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface StarData {
  id: string;
  name: string;
  constellationId: string;
  magnitude: number;
  eraPositions: Position3D[];
}

export interface Connection {
  starIdA: string;
  starIdB: string;
}

export interface Constellation {
  id: string;
  name: string;
  starIds: string[];
  connections: Connection[];
  labelPosition: Position3D;
}

export interface Era {
  index: number;
  name: string;
  year: number;
}

export interface TimelineState {
  currentEraIndex: number;
  targetEraIndex: number;
  transitionProgress: number;
  isPlaying: boolean;
  selectedStarId: string | null;
}

export interface StarRenderState {
  id: string;
  currentPosition: Position3D;
  targetPosition: Position3D;
  visualSize: number;
  visualColor: string;
  isHighlighted: boolean;
}
