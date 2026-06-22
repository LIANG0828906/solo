export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  number: number;
  color: string;
  pocketed: boolean;
  trail: { x: number; y: number }[];
}

export interface Player {
  id: number;
  name: string;
  score: number;
  group: 'low' | 'high' | null;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export interface TableConfig {
  width: number;
  height: number;
  borderWidth: number;
  innerWidth: number;
  innerHeight: number;
  offsetX: number;
  offsetY: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export interface AimData {
  isAiming: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  power: number;
}

export type GamePhase = 'break' | 'aiming' | 'shooting' | 'moving' | 'gameOver';

export interface GameState {
  balls: Ball[];
  players: Player[];
  currentPlayer: number;
  gamePhase: GamePhase;
  aimData: AimData;
  particles: Particle[];
  ripples: Ripple[];
  breakAnimationTime: number;
  cueStickProgress: number;
  winner: number | null;
}
