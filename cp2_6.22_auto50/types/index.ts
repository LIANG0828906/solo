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
  isDead?: boolean;
  actionState?: number;
}

export interface FrameData {
  timestamp: number;
  position?: Vector2;
  velocity?: Vector2;
  isGrounded?: boolean;
  facing?: 1 | -1;
  isJumping?: boolean;
  isDead?: boolean;
  actionState?: number;
}

export interface RecordingSegment {
  id: string;
  startTime: number;
  endTime: number;
  color: number;
  keyframes: FrameData[];
  loop: boolean;
  name?: string;
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

export interface SweptAABBResult {
  position: Vector2;
  tHitX: number;
  tHitY: number;
  tFirst: number;
  hitNormal: boolean;
  hitX: boolean;
  hitY: boolean;
  hitGround: boolean;
  hitCeiling: boolean;
  hitLeft: boolean;
  hitRight: boolean;
  cornerCollision: boolean;
  collidedPlatform?: PlatformConfig;
}

export interface InterpolationCacheEntry {
  time: number;
  state: PlayerState;
  prevIndex: number;
  nextIndex: number;
  accessCount: number;
  lastAccessTime: number;
}

export interface LRUCacheOptions {
  maxSize: number;
  ttl?: number;
}

export interface MechanismTriggerEvent {
  mechanismId: string;
  mechanismType: 'button' | 'door' | 'goal';
  triggerTime: number;
  triggerOffset: number;
  sourceType: 'player' | 'ghost';
  sourceId: string;
  sourceOffset: number;
  active: boolean;
}

export interface TimeRecorderConfig {
  sampleRate: number;
  positionThreshold: number;
  velocityThreshold: number;
  maxUndoSteps: number;
}

export const DEFAULT_TIME_RECORDER_CONFIG: TimeRecorderConfig = {
  sampleRate: 2,
  positionThreshold: 0.5,
  velocityThreshold: 5,
  maxUndoSteps: 50
};

export interface TimelineSegmentStyle {
  showLabels: boolean;
  showDividers: boolean;
  highlightMode: 'border' | 'fill' | 'glow';
  labelFormat: string;
}

export const DEFAULT_TIMELINE_STYLE: TimelineSegmentStyle = {
  showLabels: true,
  showDividers: true,
  highlightMode: 'glow',
  labelFormat: '#{index}'
};
