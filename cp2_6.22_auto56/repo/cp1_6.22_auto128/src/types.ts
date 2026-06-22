export interface Debris {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

export interface GravityField {
  id: number;
  x: number;
  y: number;
  createdAt: number;
  duration: number;
  rippleRadius: number;
  rippleDuration: number;
  active: boolean;
  fadeStart: number;
}

export interface CollectFlash {
  x: number;
  y: number;
  createdAt: number;
  duration: number;
}

export interface Level {
  id: number;
  targetScore: number;
  debrisCount: number;
  description: string;
}

export interface GameState {
  currentLevel: number;
  score: number;
  scoreAnimation: { targetScore: number; scale: number; animating: boolean; startAt: number };
  debris: Debris[];
  gravityFields: GravityField[];
  collectFlashes: CollectFlash[];
  levelComplete: boolean;
  levelCompleteAt: number;
  shipX: number;
  shipY: number;
  hatchRadius: number;
}
