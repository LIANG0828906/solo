export type EventType =
  | 'player:command'
  | 'player:select'
  | 'colony:resource_update'
  | 'colony:upgrade'
  | 'colony:spawn'
  | 'ant:death'
  | 'ant:state_change'
  | 'game:tick'
  | 'game:alert_zone'
  | 'ui:command_issued';

export interface EventPayload {
  [key: string]: unknown;
}

export interface EventCallback {
  (payload: EventPayload): void;
}

class EventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  on(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: EventType, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: EventType, payload: EventPayload = {}): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[EventBus] Error in ${event} handler:`, e);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
