export type GameEventType =
  | 'level:start'
  | 'level:complete'
  | 'loop:reset'
  | 'loop:tick'
  | 'block:placed'
  | 'block:removed'
  | 'blueprint:updated'
  | 'state:changed';

export interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

export interface PlacedBlock extends BlockPosition {
  height: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  startPos: BlockPosition;
  endPos: BlockPosition;
  terrain: number[][];
  obstacles: BlockPosition[];
  movingObstacles?: { x: number; z: number; minY: number; maxY: number }[];
  hint: string;
}

export interface ParticleConfig {
  x: number;
  y: number;
  z: number;
  count: number;
  colors?: number[];
  size?: number;
  duration?: number;
  type?: 'land' | 'celebrate';
}

export interface EventEmitter {
  on(event: GameEventType, listener: (...args: any[]) => void): void;
  off(event: GameEventType, listener: (...args: any[]) => void): void;
  emit(event: GameEventType, ...args: any[]): void;
}

export class SimpleEventEmitter implements EventEmitter {
  private listeners: Map<GameEventType, Set<(...args: any[]) => void>> = new Map();

  on(event: GameEventType, listener: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: GameEventType, listener: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: GameEventType, ...args: any[]): void {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}
