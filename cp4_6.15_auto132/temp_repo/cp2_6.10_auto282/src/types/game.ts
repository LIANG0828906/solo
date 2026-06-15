export interface GameState {
  level: number;
  crystalsCollected: number;
  totalCrystals: number;
  time: number;
  isPaused: boolean;
  isStunned: boolean;
  speedMultiplier: number;
  beamsDisabled: boolean;
  stunTimer: number;
}

export interface Crystal {
  id: string;
  position: [number, number, number];
  collected: boolean;
}

export interface LightBeam {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  flashFrequency: number;
  phase: number;
}

export interface PlayerState {
  position: [number, number, number];
  velocity: [number, number, number];
  isGrounded: boolean;
}

export interface Particle {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface MazeConfig {
  size: number;
  rotationSpeed: number;
  beamCount: number;
  crystalCount: number;
  minFlashFrequency: number;
  maxFlashFrequency: number;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'COLLECT_CRYSTAL' }
  | { type: 'HIT_BEAM' }
  | { type: 'STUN_END' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'DISABLE_BEAMS' };
