type EventHandler = (...args: unknown[]) => void;

class EventBus {
  private events: Map<string, Set<EventHandler>> = new Map();

  emit(event: string, ...args: unknown[]) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
    return () => {
      const handlers = this.events.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}

export const eventBus = new EventBus();
