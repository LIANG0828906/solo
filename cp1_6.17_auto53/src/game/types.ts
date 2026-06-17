export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  speed: number;
  isInvincible: boolean;
  invincibleTimer: number;
  isFlashing: boolean;
  flashTimer: number;
  shieldActive: boolean;
  shieldTimer: number;
  energy: number;
  maxEnergy: number;
  shootCooldown: number;
}

export type EnemyType = 'straight' | 'wave' | 'elite' | 'boss';

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  score: number;
  shootCooldown: number;
  shootTimer: number;
  waveOffset: number;
  initialY: number;
  pattern: string;
  patternTimer: number;
}

export interface Bullet extends Entity {
  damage: number;
  isPlayerBullet: boolean;
  color: string;
  isReflected?: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  stars: Star[];
  score: number;
  wave: number;
  combo: number;
  comboMultiplier: number;
  comboTimer: number;
  isPlaying: boolean;
  isGameOver: boolean;
  waveTimer: number;
  isWaveActive: boolean;
  boss: Enemy | null;
  totalKills: number;
  transitionProgress: number;
  isTransitioning: boolean;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  shield: boolean;
}
