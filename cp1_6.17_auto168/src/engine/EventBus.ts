type Callback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, Callback[]> = new Map();

  on(event: string, callback: Callback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const idx = callbacks.indexOf(callback);
        if (idx > -1) callbacks.splice(idx, 1);
      }
    };
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }

  off(event: string, callback: Callback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    }
  }
}

export const eventBus = new EventBus();
export default EventBus;
