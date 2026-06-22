export type BeatPhase = 0 | 1 | 2 | 3;

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'ended';
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  scoreMultiplier: number;
  blocks: Block[];
  bullets: Bullet[];
  particles: Particle[];
  scorePopups: ScorePopup[];
  songName: string;
  songProgress: number;
  bpm: number;
}

export interface Block {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  angle: number;
  speed: number;
  size: number;
  beatPhase: BeatPhase;
  color: string;
  opacity: number;
  distanceFromCenter: number;
  spawnTime: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  decay: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  score: number;
  life: number;
}

export interface ScoreRecord {
  songName: string;
  score: number;
  maxCombo: number;
  timestamp: number;
}
