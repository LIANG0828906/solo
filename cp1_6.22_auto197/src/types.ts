export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {
  type: 'solid' | 'spike' | 'goal';
}

export interface PressurePlate extends Rect {
  id: string;
  activated: boolean;
  linkedDoorIds: string[];
}

export interface Door extends Rect {
  id: string;
  open: boolean;
  timer: number;
  maxTimer: number;
  isTimed: boolean;
}

export interface PushableBox extends Rect {
  id: string;
  vx: number;
  vy: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  onGround: boolean;
  facingRight: boolean;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export interface CloneState {
  id: number;
  frameIndex: number;
  data: PlayerState[];
  active: boolean;
}

export interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  spawn: Vector2;
  platforms: Platform[];
  plates: PressurePlate[];
  doors: Door[];
  boxes: PushableBox[];
  goal: Rect;
}

export interface GameState {
  player: PlayerState;
  clones: CloneState[];
  boxes: PushableBox[];
  plates: PressurePlate[];
  doors: Door[];
  lives: number;
  currentLevel: number;
  isRecording: boolean;
  hasRewound: boolean;
  isFlashing: boolean;
  flashTimer: number;
  rippleEffects: RippleEffect[];
}

export interface RippleEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  duration: number;
  elapsed: number;
}

export type Screen = 'menu' | 'levelSelect' | 'playing';
