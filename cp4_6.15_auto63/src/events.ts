type EventCallback = (...args: any[]) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(...args));
    }
  }
}

export const events = new EventBus();
export default events;
