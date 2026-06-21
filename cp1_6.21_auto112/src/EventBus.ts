type EventCallback = (...args: any[]) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`[EventBus] Error in listener for event "${event}":`, e);
        }
      });
    }
  }

  once(event: string, callback: EventCallback): void {
    const wrapper = (...args: any[]) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

export const eventBus = new EventBus();

export enum GameEvents {
  PLAYER_MOVE = 'player:move',
  PLAYER_BLOCKED = 'player:blocked',
  FOG_REVEALED = 'fog:revealed',
  TREASURE_COLLECTED = 'treasure:collected',
  GAME_WIN = 'game:win',
  WORLD_INITIALIZED = 'world:initialized',
  SCORE_UPDATED = 'score:updated',
  EXPLORE_UPDATED = 'explore:updated'
}

export interface PlayerMoveData {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
}

export interface TreasureCollectData {
  index: number;
  score: number;
  total: number;
}

export interface FogRevealData {
  tiles: Array<{ gridX: number; gridY: number }>;
}

export interface ExploreUpdateData {
  exploredCount: number;
  totalTiles: number;
}
