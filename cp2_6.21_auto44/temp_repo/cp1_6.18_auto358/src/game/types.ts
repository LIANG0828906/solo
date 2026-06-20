export interface Point {
  x: number;
  y: number;
}

export interface BeamSegment {
  start: Point;
  end: Point;
  color: string;
  width: number;
  energy: number;
}

export interface Mirror {
  id: string;
  position: Point;
  angle: number;
  length: number;
}

export interface Prism {
  id: string;
  position: Point;
  rotation: number;
  sideLength: number;
}

export interface Attenuator {
  id: string;
  position: Point;
  radius: number;
}

export interface Target {
  position: Point;
  radius: number;
  hit: boolean;
}

export interface Lens {
  id: string;
  position: Point;
  angle: number;
  radius: number;
  placed: boolean;
}

export interface Particle {
  id: string;
  position: Point;
  velocity: Point;
  color: string;
  size: number;
  opacity: number;
  life: number;
}

export interface LevelData {
  gridSize: number;
  mirrors: Mirror[];
  prisms: Prism[];
  attenuators: Attenuator[];
  target: Target;
  beamStart: Point;
  beamAngle: number;
}

export interface GameState {
  level: number;
  score: number;
  stepsRemaining: number;
  levelData: LevelData | null;
  placedLenses: Lens[];
  availableLenses: Lens[];
  beamPath: BeamSegment[];
  particles: Particle[];
  selectedLensId: string | null;
  levelComplete: boolean;
  fireworks: Particle[];
}
