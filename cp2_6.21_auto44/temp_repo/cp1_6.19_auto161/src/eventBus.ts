type EventType =
  | 'shape:add'
  | 'shape:move'
  | 'shape:delete'
  | 'shape:update'
  | 'chat:message'
  | 'session:new'
  | 'user:join';

type EventCallback = (data: any) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  on(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  emit(event: EventType, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`EventBus error in listener for ${event}:`, e);
        }
      });
    }
  }

  off(event: EventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
}

export const eventBus = new EventBus();
export type { EventType, EventCallback };
