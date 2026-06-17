import type { EventMap } from './types';

type EventCallback<K extends keyof EventMap> = (data: EventMap[K]) => void;

export class EventBus {
  private listeners: Map<keyof EventMap, Set<EventCallback<keyof EventMap>>>;

  constructor() {
    this.listeners = new Map();
  }

  on<K extends keyof EventMap>(event: K, callback: EventCallback<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event) as Set<EventCallback<K>>;
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        (cb as EventCallback<K>)(data);
      });
    }
  }

  off<K extends keyof EventMap>(event: K, callback: EventCallback<K>): void {
    const set = this.listeners.get(event) as Set<EventCallback<K>> | undefined;
    if (set) {
      set.delete(callback);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
