type Handler<T = any> = (payload: T) => void;

class EventBus {
  private handlers: Map<string, Set<Handler>> = new Map();

  on<T = any>(event: string, handler: Handler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off<T = any>(event: string, handler: Handler<T>): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  emit<T = any>(event: string, payload?: T): void {
    const set = this.handlers.get(event);
    if (set) {
      set.forEach((handler) => handler(payload));
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
