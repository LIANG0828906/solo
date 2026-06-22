export enum ParticleType {
  RED_CIRCLE = 0,
  BLUE_SQUARE = 1,
  GREEN_TRIANGLE = 2,
  PURPLE_DIAMOND = 3,
  GOLD_STAR = 4
}

export interface Particle {
  id: number;
  type: ParticleType;
  row: number;
  col: number;
  renderX: number;
  renderY: number;
  targetX: number;
  targetY: number;
  scale: number;
  opacity: number;
  isMatched: boolean;
  isNew: boolean;
  spawnProgress: number;
  matchProgress: number;
}

export interface MatchGroup {
  particles: Particle[];
  isChained: boolean;
}

export interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface SwapInfo {
  from: { row: number; col: number };
  to: { row: number; col: number };
  progress: number;
  duration: number;
  isReverting: boolean;
  onComplete?: () => void;
}

export interface GameStateSnapshot {
  grid: (Particle | null)[][];
  score: number;
  highScore: number;
  timeLeft: number;
  totalTime: number;
  isPlaying: boolean;
  isProcessing: boolean;
  chainCount: number;
  showResult: boolean;
  rows: number;
  cols: number;
}

export type GameEvent =
  | { type: 'match'; groups: MatchGroup[]; chainLevel: number }
  | { type: 'chain'; level: number }
  | { type: 'swap'; valid: boolean }
  | { type: 'gameover'; score: number; highScore: number }
  | { type: 'start' }
  | { type: 'scoreUpdate'; score: number };

export const PARTICLE_COLORS: Record<ParticleType, { main: string; light: string; dark: string }> = {
  [ParticleType.RED_CIRCLE]: { main: '#FF4757', light: '#FF8A94', dark: '#C0303A' },
  [ParticleType.BLUE_SQUARE]: { main: '#3742FA', light: '#7A82FC', dark: '#252FB3' },
  [ParticleType.GREEN_TRIANGLE]: { main: '#2ED573', light: '#7BE8A5', dark: '#1F9A54' },
  [ParticleType.PURPLE_DIAMOND]: { main: '#A55EEA', light: '#C896F3', dark: '#7A41AD' },
  [ParticleType.GOLD_STAR]: { main: '#FFD700', light: '#FFE870', dark: '#B89900' }
};

export const PARTICLE_NAMES: Record<ParticleType, string> = {
  [ParticleType.RED_CIRCLE]: 'RED_CIRCLE',
  [ParticleType.BLUE_SQUARE]: 'BLUE_SQUARE',
  [ParticleType.GREEN_TRIANGLE]: 'GREEN_TRIANGLE',
  [ParticleType.PURPLE_DIAMOND]: 'PURPLE_DIAMOND',
  [ParticleType.GOLD_STAR]: 'GOLD_STAR'
};
