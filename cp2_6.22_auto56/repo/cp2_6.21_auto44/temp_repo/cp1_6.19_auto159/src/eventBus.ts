type EventCallback = (...args: any[]) => void;

interface EventMap {
  fieldParamsChanged: {
    electricStrength: number;
    magneticStrength: number;
    electricDirection: { x: number; y: number; z: number };
  };
  particleCountChanged: number;
}

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

export const eventBus = new EventBus();
export type { EventMap };
