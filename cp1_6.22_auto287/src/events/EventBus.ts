type EventCallback = (data: unknown) => void;

class EventBusClass {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event: string, data?: unknown): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }
}

export const EventBus = new EventBusClass();

export type HealthChangedEvent = {
  zone: 'forest' | 'desert' | 'glacier';
  health: number;
  delta: number;
};

export type DisasterOccurredEvent = {
  type: 'fire' | 'flood' | 'drought';
  zone: 'forest' | 'desert' | 'glacier';
};

export type ResourceChangedEvent = {
  zone: 'forest' | 'desert' | 'glacier';
  resource: 'wood' | 'water' | 'ore';
  amount: number;
  delta: number;
};
