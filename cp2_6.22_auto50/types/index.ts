export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerState {
  position: Vector2;
  velocity: Vector2;
  isGrounded: boolean;
  facing: 1 | -1;
  isJumping: boolean;
}

export interface FrameData {
  timestamp: number;
  position?: Vector2;
  velocity?: Vector2;
  isGrounded?: boolean;
  facing?: 1 | -1;
  isJumping?: boolean;
}

export interface RecordingSegment {
  id: string;
  startTime: number;
  endTime: number;
  color: number;
  keyframes: FrameData[];
  loop: boolean;
}

export interface RecordingSnapshot {
  timestamp: number;
  segments: RecordingSegment[];
  playerState: PlayerState;
  thumbnail?: string;
}

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'moving' | 'crumbling';
}

export interface SpikeConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ButtonConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  requiresSimultaneous?: string[];
  triggerWindowMs?: number;
}

export interface DoorConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  triggeredBy: string[];
  requiresAll?: boolean;
}

export interface GoalConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  playerStart: Vector2;
  platforms: PlatformConfig[];
  spikes: SpikeConfig[];
  buttons: ButtonConfig[];
  doors: DoorConfig[];
  goal: GoalConfig;
  timeLimit?: number;
  ghostColors: number[];
  maxRecordings: number;
}

export interface UIButtonStyle {
  normal: number;
  hover: number;
  active: number;
  disabled: number;
  glow: number;
}

export interface GameStats {
  steps: number;
  timeElapsed: number;
  recordingsCount: number;
  score: number;
}

export type GameMode = 'playing' | 'recording' | 'playback' | 'paused' | 'rewinding';

export interface ButtonTriggerEvent {
  buttonId: string;
  triggerTime: number;
  sourceType: 'player' | 'ghost';
  sourceId: string;
}
