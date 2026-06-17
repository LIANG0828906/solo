export enum MineralType {
  Surface = 'surface',
  Mid = 'mid',
  Deep = 'deep'
}

export interface Mineral {
  id: string;
  type: MineralType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export interface Shockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  startTime: number;
}

export interface Meteor {
  id: string;
  x: number;
  y: number;
  vy: number;
  vx: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  countdown: number;
  active: boolean;
}

export interface MeteorEvent {
  active: boolean;
  warningPhase: boolean;
  warningStartTime: number;
  shakeFrames: number;
  meteors: Meteor[];
}

export interface Resources {
  surface: number;
  mid: number;
  deep: number;
  total: number;
}

export interface MineralUnlock {
  surface: boolean;
  mid: boolean;
  deep: boolean;
}

export interface GameState {
  resources: Resources;
  minerals: Mineral[];
  autoMineRate: number;
  autoMineLevel: number;
  meteorEvent: MeteorEvent;
  shockwaves: Shockwave[];
  productionPaused: boolean;
  productionPausedUntil: number;
  recoveryStartTime: number;
  nextMeteorTime: number;
  mineralUnlocks: MineralUnlock;
  upgrades: {
    clickPower: number;
    autoMine: number;
  };
}

export interface RenderState {
  gameState: GameState;
  canvasWidth: number;
  canvasHeight: number;
  currentTime: number;
}
