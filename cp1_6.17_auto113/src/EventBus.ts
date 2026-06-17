import { EventType, EventCallback } from './types';

class EventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  on(type: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => this.off(type, callback);
  }

  off(type: EventType, callback: EventCallback): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(callback);
    }
  }

  emit(type: EventType, data: unknown = null): void {
    const set = this.listeners.get(type);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('EventBus listener error:', e);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
