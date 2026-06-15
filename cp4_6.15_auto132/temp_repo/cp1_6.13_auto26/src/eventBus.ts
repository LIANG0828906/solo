type EventCallback = (...args: unknown[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(...args);
      });
    }
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  WIND_DATA_UPDATED: 'wind:data:updated',
  ALTITUDE_CHANGED: 'altitude:changed',
  EARTH_ROTATION_SPEED_CHANGED: 'earth:rotation:speed:changed',
  PARTICLES_READY: 'particles:ready',
  INFO_UPDATE: 'info:update',
} as const;
