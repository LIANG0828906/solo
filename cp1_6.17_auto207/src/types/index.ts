export type GameState = 'menu' | 'playing' | 'paused' | 'result';

export type PlayerAction = 'jump' | 'slide' | null;

export type HitResult = 'perfect' | 'good' | 'miss' | null;

export type GradeType = 'S' | 'A' | 'B' | 'C';

export interface BeatData {
  timestamps: number[];
  bpm: number;
}

export interface Obstacle {
  id: number;
  x: number;
  type: 'spike' | 'pendulum' | 'block';
  y: number;
  width: number;
  height: number;
  passed: boolean;
}

export interface BeatFragment {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  beatIndex: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface LevelData {
  id: number;
  name: string;
  description: string;
  bpm: number;
  beatTimestamps: number[];
  obstaclePattern: ('spike' | 'pendulum' | 'block')[];
}

export interface GameStats {
  totalScore: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  syncRateHistory: number[];
  finalGrade: GradeType;
  averageSyncRate: number;
}

export interface HitRecord {
  beatIndex: number;
  timestamp: number;
  result: HitResult;
  action: PlayerAction;
}
