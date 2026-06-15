type EventHandler<T> = (payload: T) => void;

type EventMap = Record<string, any>;

export class EventBus<Events extends EventMap> {
  private handlers: Map<keyof Events, Set<EventHandler<any>>>;

  constructor() {
    this.handlers = new Map();
  }

  on<E extends keyof Events>(event: E, handler: EventHandler<Events[E]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  off<E extends keyof Events>(event: E, handler: EventHandler<Events[E]>): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      if (eventHandlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        handler(payload);
      });
    }
  }

  clear(): void {
    this.handlers.clear();
  }

  hasListeners<E extends keyof Events>(event: E): boolean {
    const eventHandlers = this.handlers.get(event);
    return eventHandlers ? eventHandlers.size > 0 : false;
  }

  listenerCount<E extends keyof Events>(event: E): number {
    const eventHandlers = this.handlers.get(event);
    return eventHandlers ? eventHandlers.size : 0;
  }
}
