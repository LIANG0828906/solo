type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    return () => {
      this.off(event, callback);
    };
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (e) {
        console.error(`Error in event handler for '${event}':`, e);
      }
    });
  }

  once(event: string, callback: EventCallback): () => void {
    const wrapper = (...args: any[]) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  clear(): void {
    this.events = {};
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  BUILDING_PLACE: 'building:place',
  BUILDING_REMOVE: 'building:remove',
  UNIT_MOVE: 'unit:move',
  UNIT_ATTACK: 'unit:attack',
  UNIT_SELECT: 'unit:select',
  BUILDING_SELECT: 'building:select',
  BUILD_TYPE_SELECT: 'buildtype:select',
  NEXT_TURN: 'turn:next',
  STATE_UPDATED: 'state:updated',
  GAME_ENDED: 'game:ended',
  PROJECTILE_FIRED: 'projectile:fired',
  EXPLOSION: 'explosion',
  GAME_START: 'game:start',
  GAME_RESET: 'game:reset',
  REPLAY_JUMP: 'replay:jump',
  REPLAY_TOGGLE: 'replay:toggle',
  RESOURCE_UPDATE: 'resource:update',
  TOWER_FIRE: 'tower:fire',
  DAMAGE_DEALT: 'damage:dealt',
  MORALE_CHANGE: 'morale:change',
} as const;
