import { EventHandler, EventMap } from './types';

type EventNames = keyof EventMap;

export class EventBus {
  private handlers: Map<EventNames, Set<EventHandler<EventMap[EventNames]>>>;

  constructor() {
    this.handlers = new Map();
  }

  on<K extends EventNames>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler<EventMap[EventNames]>);
  }

  off<K extends EventNames>(event: K, handler: EventHandler<EventMap[K]>): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler as EventHandler<EventMap[EventNames]>);
    }
  }

  emit<K extends EventNames>(event: K, data: EventMap[K]): void {
    const set = this.handlers.get(event);
    if (set) {
      set.forEach((handler) => handler(data));
    }
  }
}

export const eventBus = new EventBus();
