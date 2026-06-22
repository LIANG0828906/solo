export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Vector2;
  velocity: Vector2;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  size: number;
  isGlowing: boolean;
  glowStartTime: number;
  glowCooldownEnd: number;
  isInvincible: boolean;
  invincibleEnd: number;
  hitFlashEnd: number;
  combo: number;
  doubleScoreEnd: number;
}

export interface Plankton {
  id: number;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  basePosition: Vector2;
  wanderRadius: number;
  wanderAngle: number;
}

export interface Predator {
  id: number;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  speedMultiplier: number;
  respawnTime: number;
  isRetreating: boolean;
  retreatEnd: number;
}

export interface Decoy {
  id: number;
  position: Vector2;
  radius: number;
  expireTime: number;
}

export interface Particle {
  id: number;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  position: Vector2;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Cave {
  position: Vector2;
  radius: number;
}

export interface TerrainCell {
  height: number;
  isWall: boolean;
}

export interface TerrainData {
  grid: TerrainCell[][];
  gridSize: number;
  cellSize: number;
  caves: Cave[];
  noiseFrequency: number;
}

export type GamePhase = 'playing' | 'gameover';

export interface GameState {
  phase: GamePhase;
  score: number;
  timeRemaining: number;
  totalCollected: number;
  maxSize: number;
  difficultyLevel: number;
  tideActive: boolean;
  tideEnd: number;
  screenFlash: {
    active: boolean;
    endTime: number;
    color: string;
  };
  darkenScreen: number;
}
