import { EventBusEvents } from './types';

type EventHandler<T> = (data: T) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();

  on<K extends keyof EventBusEvents>(event: K, handler: EventHandler<EventBusEvents[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler<unknown>);
  }

  off<K extends keyof EventBusEvents>(event: K, handler: EventHandler<EventBusEvents[K]>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler<unknown>);
    }
  }

  emit<K extends keyof EventBusEvents>(event: K, data: EventBusEvents[K]): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
