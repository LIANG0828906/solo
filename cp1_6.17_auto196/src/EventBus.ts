type Listener<T = any> = (data: T) => void;

class EventBusClass {
  private listeners: Map<string, Set<Listener>> = new Map();

  on<T = any>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off<T = any>(event: string, listener: Listener<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  emit<T = any>(event: string, data: T): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(listener => listener(data));
    }
  }
}

export const EventBus = new EventBusClass();
