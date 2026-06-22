import type { Laser } from './collision';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isFragment: boolean;
  active: boolean;
  rotation: number;
  rotationSpeed: number;
}

export interface EnergyCapsule {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export interface AITeammate {
  id: number;
  x: number;
  y: number;
  color: string;
  targetId: number | null;
  fireCooldown: number;
  angle: number;
}

export interface BroadcastSignal {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  duration: number;
  elapsed: number;
  active: boolean;
}

export interface GameState {
  player: {
    x: number;
    y: number;
    angle: number;
    energy: number;
    maxEnergy: number;
    speed: number;
  };
  lasers: Laser[];
  asteroids: Asteroid[];
  capsules: EnergyCapsule[];
  aiTeammates: AITeammate[];
  broadcastSignal: BroadcastSignal | null;
  score: number;
  gameOver: boolean;
  starsFar: Star[];
  starsNear: Star[];
}
