type EventCallback = (...args: unknown[]) => void;

class EventBusClass {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }

  once(event: string, callback: EventCallback): () => void {
    const wrapper = (...args: unknown[]) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

export const eventBus = new EventBusClass();

export type AppEvent =
  | 'assets:loaded'
  | 'element:added'
  | 'element:removed'
  | 'element:updated'
  | 'element:selected'
  | 'frame:change'
  | 'frame:added'
  | 'frame:removed'
  | 'frame:reordered'
  | 'play:start'
  | 'play:stop'
  | 'play:progress';
