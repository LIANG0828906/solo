export type RailEvent =
  | { type: 'segmentGenerated'; segmentIndex: number; segmentData: SegmentData }
  | { type: 'collision'; collisionType: 'obstacle' | 'energy'; position: { x: number; y: number; z: number } }
  | { type: 'scoreChanged'; score: number; combo: number }
  | { type: 'speedChanged'; speed: number }
  | { type: 'playerMoved'; position: { x: number; y: number; z: number }; lane: number }
  | { type: 'segmentChanged'; segmentIndex: number };

export type UIEvent =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'restart' }
  | { type: 'gameOver'; finalScore: number }
  | { type: 'lifeLost'; lives: number }
  | { type: 'lifeRestored'; lives: number };

export interface SegmentData {
  index: number;
  length: number;
  width: number;
  bendAngle: number;
  tiltAngle: number;
  startZ: number;
  endZ: number;
  obstacles: ObstacleData[];
  energyBlocks: EnergyBlockData[];
}

export interface ObstacleData {
  x: number;
  z: number;
  lane: number;
  collected?: boolean;
}

export interface EnergyBlockData {
  x: number;
  z: number;
  lane: number;
  collected?: boolean;
  meshId?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  lane: number;
  speed: number;
  isJumping: boolean;
  jumpTime: number;
  jumpCooldown: number;
  lives: number;
  score: number;
  combo: number;
  energyCollected: number;
  distance: number;
  isPaused: boolean;
  isGameOver: boolean;
  lastLifeLossTime: number;
}

type EventCallback = (event: RailEvent | UIEvent) => void;

class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(eventType: string, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: RailEvent | UIEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(event);
      }
    }
  }
}

export const eventBus = new EventBus();

export function on(eventType: string, callback: EventCallback): void {
  eventBus.on(eventType, callback);
}

export function emit(event: RailEvent | UIEvent): void {
  eventBus.emit(event);
}
