export enum ParticleState {
  CLASSIC = 'classic',
  SUPERPOSITION = 'superposition',
  ENTANGLED = 'entangled',
  COLLAPSED = 'collapsed'
}

export enum ParticleColor {
  BLUE = 'blue',
  ORANGE = 'orange'
}

export enum GateColor {
  BLUE = 'blue',
  ORANGE = 'orange',
  PURPLE = 'purple',
  GREEN = 'green'
}

export interface AnimationState {
  isAnimating: boolean;
  animationType: 'move' | 'stateChange' | 'entangle' | 'collapse' | null;
  progress: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  duration: number;
}

export interface VisualEffect {
  id: string;
  type: 'sparkle' | 'wave' | 'glow' | 'burst' | 'connection';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  color: string;
  startTime: number;
  duration: number;
  progress: number;
}

export interface Particle {
  id: string;
  color: ParticleColor;
  state: ParticleState;
  gridX: number;
  gridY: number;
  entangledWith: string | null;
  animation: AnimationState;
}

export interface Gate {
  id: string;
  color: GateColor;
  gridX: number;
  gridY: number;
  isSatisfied: boolean;
}

export interface Cell {
  gridX: number;
  gridY: number;
  isPath: boolean;
  isHighlighted?: boolean;
}

export interface LevelData {
  levelNumber: number;
  gridSize: number;
  particles: Particle[];
  gates: Gate[];
  grid: Cell[][];
}

export interface GameState {
  currentLevel: number;
  steps: number;
  isPaused: boolean;
  isWin: boolean;
  particles: Particle[];
  gates: Gate[];
  grid: Cell[][];
  effects: VisualEffect[];
}
