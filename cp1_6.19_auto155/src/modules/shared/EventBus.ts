type EventCallback = (...args: unknown[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  emit(eventName: string, ...args: unknown[]): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }

  on(eventName: string, callback: EventCallback): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(callback);
    return () => {
      const callbacks = this.events.get(eventName);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
}

export const eventBus = new EventBus();
export const PROJECTS_UPDATED = 'PROJECTS_UPDATED';
