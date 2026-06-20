export interface Point {
  x: number;
  y: number;
}

export interface Meteor {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  angle: number;
  hasSideShift: boolean;
  sideShiftPhase: number;
  sideShiftTimer: number;
  isMoving: boolean;
}

export interface Tower {
  id: string;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  level: 1 | 2;
  range: number;
  fireInterval: number;
  lastFireTime: number;
  damage: number;
  bulletSpeed: number;
  color: string;
  bulletColor: string;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  targetMeteorId: string;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface GameStateData {
  coreHp: number;
  coreMaxHp: number;
  corePosition: Point;
  resources: number;
  lastResourceTick: number;
  currentWave: number;
  isWaveActive: boolean;
  waveMeteorTotal: number;
  waveMeteorSpawned: number;
  lastSpawnTime: number;
  isVictoryAnimating: boolean;
  victoryAnimStart: number;
  meteors: Meteor[];
  towers: Tower[];
  bullets: Bullet[];
  particles: Particle[];
  screenShake: number;
  screenShakeStart: number;
  buildBubblePosition: Point | null;
  selectedTowerId: string | null;
  insufficientResourceMsg: string | null;
  insufficientResourceTime: number;
  isGameOver: boolean;
  finalWave: number;
  buildMode: boolean;
}

export interface GameActions {
  updateCoreHp: (delta: number) => void;
  deductResources: (amount: number) => boolean;
  addResources: (amount: number) => void;
  startWave: () => void;
  completeWave: () => void;
  addMeteor: (meteor: Meteor) => void;
  removeMeteor: (id: string) => void;
  setMeteors: (meteors: Meteor[]) => void;
  addTower: (tower: Tower) => void;
  upgradeTower: (id: string) => boolean;
  addBullet: (bullet: Bullet) => void;
  removeBullet: (id: string) => void;
  setBullets: (bullets: Bullet[]) => void;
  addParticles: (particles: Particle[]) => void;
  setParticles: (particles: Particle[]) => void;
  setBuildBubble: (pos: Point | null) => void;
  selectTower: (id: string | null) => void;
  showInsufficientResource: (msg: string) => void;
  clearInsufficientResource: () => void;
  triggerScreenShake: () => void;
  triggerVictoryAnimation: () => void;
  setLastResourceTick: (time: number) => void;
  setLastSpawnTime: (time: number) => void;
  incrementWaveMeteorSpawned: () => void;
  setWaveActive: (active: boolean) => void;
  setScreenShake: (shake: number) => void;
  setVictoryAnimating: (animating: boolean) => void;
  setBuildMode: (mode: boolean) => void;
  resetGame: () => void;
}

export type GameStore = GameStateData & GameActions;
