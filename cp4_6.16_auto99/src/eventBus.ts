export type GameEventType =
  | 'collision'
  | 'score'
  | 'powerup_pickup'
  | 'speed_phase_start'
  | 'speed_phase_end'
  | 'skill_activate'
  | 'game_over'
  | 'player_state_change';

export interface GameEvent {
  type: GameEventType;
  data?: unknown;
  timestamp: number;
}

export type EventCallback = (event: GameEvent) => void;

class EventBus {
  private listeners: Map<GameEventType, Set<EventCallback>> = new Map();

  on(type: GameEventType, callback: EventCallback): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  off(type: GameEventType, callback: EventCallback): void {
    this.listeners.get(type)?.delete(callback);
  }

  emit(type: GameEventType, data?: unknown): void {
    const event: GameEvent = {
      type,
      data,
      timestamp: performance.now()
    };

    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (e) {
          console.error('EventBus callback error:', e);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
