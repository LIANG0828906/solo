import type { EventType, EventPayloadMap } from './types';

type Handler<T = unknown> = (payload: T) => void;

class EventBus {
  private handlers: Map<EventType, Set<Handler>> = new Map();

  publish<T extends EventType>(event: T, payload: EventPayloadMap[T]): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`Error in event handler for ${event}:`, e);
        }
      });
    }
  }

  subscribe<T extends EventType>(event: T, handler: (payload: EventPayloadMap[T]) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as Handler);

    return () => {
      this.unsubscribe(event, handler);
    };
  }

  unsubscribe<T extends EventType>(event: T, handler: (payload: EventPayloadMap[T]) => void): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler as Handler);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
