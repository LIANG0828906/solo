export enum EventType {
  PLANET_CREATED = 'planet:created',
  CRAFT_STATE_UPDATED = 'craft:state',
  TARGET_REACHED = 'game:target-reached',
  FUEL_CHANGED = 'craft:fuel',
  MANEUVER_EXECUTED = 'craft:maneuver',
  GAME_RESET = 'game:reset'
}

export type ManeuverType = 'accelerate' | 'decelerate' | 'turn-left' | 'turn-right';

export interface ScoreResult {
  totalScore: number;
  trailLength: number;
  fuelRemaining: number;
  maneuverCount: number;
  standardPathLength: number;
}

export type EventPayloadMap = {
  [EventType.PLANET_CREATED]: { id: string; name: string };
  [EventType.CRAFT_STATE_UPDATED]: {
    x: number; y: number; vx: number; vy: number;
    speed: number; angle: number; fuel: number;
    maneuverCount: number; trailLength: number;
    inGravityRange: boolean;
  };
  [EventType.TARGET_REACHED]: ScoreResult;
  [EventType.FUEL_CHANGED]: number;
  [EventType.MANEUVER_EXECUTED]: ManeuverType;
  [EventType.GAME_RESET]: void;
};

type Handler<T extends EventType> = (payload: EventPayloadMap[T]) => void;

class EventBus {
  private listeners: Map<string, Set<Handler<any>>> = new Map();

  on<T extends EventType>(type: T, handler: Handler<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off<T extends EventType>(type: T, handler: Handler<T>): void {
    this.listeners.get(type)?.delete(handler);
  }

  emit<T extends EventType>(type: T, payload: EventPayloadMap[T]): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const h of set) {
      try { h(payload); } catch (e) { console.error('[EventBus] handler error:', e); }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
