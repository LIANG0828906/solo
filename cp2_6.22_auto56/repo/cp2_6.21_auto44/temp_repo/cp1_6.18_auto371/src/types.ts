export interface BeatData {
  timestamp: number;
  intensity: number;
  isStrong: boolean;
}

export interface BeatAnalysisResult {
  beats: BeatData[];
  bpm: number;
  duration: number;
}

export type LaneIndex = 0 | 1 | 2;

export type ObstacleType = 'spike' | 'bar' | 'missile';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  lane: LaneIndex;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  passed: boolean;
}

export interface BeatPoint {
  id: string;
  lane: LaneIndex;
  x: number;
  collected: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GlowEffect {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface PlayerState {
  lane: LaneIndex;
  targetLane: LaneIndex;
  x: number;
  y: number;
  baseY: number;
  isJumping: boolean;
  jumpTime: number;
  jumpDuration: number;
  jumpHeight: number;
  isSliding: boolean;
  slideTime: number;
  slideDuration: number;
  laneTransitionTime: number;
  laneTransitionDuration: number;
  radius: number;
  opacity: number;
  scale: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export interface GameState {
  status: GameStatus;
  score: number;
  combo: number;
  maxCombo: number;
  beatPointsCollected: number;
  obstacles: Obstacle[];
  beatPoints: BeatPoint[];
  particles: Particle[];
  glowEffects: GlowEffect[];
  player: PlayerState;
  currentTime: number;
  speedMultiplier: number;
  lastBeatIndex: number;
  comboEffect: number;
  gameTime: number;
}

export const LANES: LaneIndex[] = [0, 1, 2];
export const LANE_COUNT = 3;
export const TRACK_SPACING = 120;
export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 600;
export const BASE_SPEED = 5;
export const OBSTACLE_SPAWN_X = CANVAS_WIDTH + 50;
export const PLAYER_X = 200;
export const PLAYER_BASE_Y = 450;
export const JUMP_HEIGHT = 150;
export const JUMP_DURATION = 600;
export const LANE_TRANSITION_DURATION = 300;
export const SLIDE_DURATION = 500;
