export interface Vec2 {
  x: number;
  y: number;
}

export interface Ship {
  pos: Vec2;
  vel: Vec2;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  shield: number;
  maxShield: number;
  angle: number;
  radius: number;
}

export type DebrisType = 'metal' | 'satellite' | 'fueltank';

export interface Debris {
  id: number;
  type: DebrisType;
  pos: Vec2;
  vel: Vec2;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  opacity: number;
  beingPulled: boolean;
  pullProgress: number;
  originalRadius: number;
  vertices?: Vec2[];
  driftTimer?: number;
  driftInterval?: number;
}

export type PowerUpType = 'shield' | 'energy' | 'timeslow';

export interface PowerUp {
  id: number;
  type: PowerUpType;
  pos: Vec2;
  vel: Vec2;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  opacity: number;
  pulsePhase: number;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export interface Upgrades {
  speed: number;
  beamRange: number;
  shieldStrength: number;
  energyCapacity: number;
}

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelcomplete';

export interface GameState {
  width: number;
  height: number;
  ship: Ship;
  debris: Debris[];
  powerUps: PowerUp[];
  particles: Particle[];
  stars: Star[];
  beamActive: boolean;
  mousePos: Vec2;
  level: number;
  collectedCount: number;
  targetCount: number;
  score: number;
  upgradePoints: number;
  phase: GamePhase;
  timeSlowActive: boolean;
  timeSlowTimer: number;
  shieldBoostActive: boolean;
  shieldBoostTimer: number;
  screenFlash: number;
  screenFlashColor: string;
  upgrades: Upgrades;
  spawnTimer: number;
  powerUpSpawnTimer: number;
  nextDebrisId: number;
  nextPowerUpId: number;
  beamEnergyCost: number;
  debrisSpawnRate: number;
  lastTime: number;
  gameTime: number;
  isTouchDevice: boolean;
}

export interface HUDData {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  shield: number;
  maxShield: number;
  collectedCount: number;
  targetCount: number;
  level: number;
  score: number;
  beamActive: boolean;
  timeSlowActive: boolean;
  shieldBoostActive: boolean;
  upgradePoints: number;
  upgrades: Upgrades;
  phase: GamePhase;
}

export function toHUDData(state: GameState): HUDData {
  return {
    health: state.ship.health,
    maxHealth: state.ship.maxHealth,
    energy: state.ship.energy,
    maxEnergy: state.ship.maxEnergy,
    shield: state.ship.shield,
    maxShield: state.ship.maxShield,
    collectedCount: state.collectedCount,
    targetCount: state.targetCount,
    level: state.level,
    score: state.score,
    beamActive: state.beamActive,
    timeSlowActive: state.timeSlowActive,
    shieldBoostActive: state.shieldBoostActive,
    upgradePoints: state.upgradePoints,
    upgrades: state.upgrades,
    phase: state.phase,
  };
}
