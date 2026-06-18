type EventCallback = (data: any) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    return () => {
      this.events.get(event)?.delete(callback);
      if (this.events.get(event)?.size === 0) {
        this.events.delete(event);
      }
    };
  }

  emit(event: string, data: any): void {
    this.events.get(event)?.forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();
