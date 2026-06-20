import type { EventName, EventPayload } from './types';

type Handler<T extends EventName> = (payload: EventPayload[T]) => void;

class EventBus {
  private handlers: Map<EventName, Set<Handler<EventName>>> = new Map();

  on<T extends EventName>(event: T, handler: Handler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    set.add(handler as Handler<EventName>);
    return () => {
      set.delete(handler as Handler<EventName>);
    };
  }

  off<T extends EventName>(event: T, handler: Handler<T>): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler as Handler<EventName>);
    }
  }

  emit<T extends EventName>(event: T, payload: EventPayload[T]): void {
    const set = this.handlers.get(event);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`EventBus handler error for ${event}:`, err);
        }
      });
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
export default eventBus;
