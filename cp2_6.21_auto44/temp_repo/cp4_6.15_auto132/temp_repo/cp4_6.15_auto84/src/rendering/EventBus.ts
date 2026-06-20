type EventMap = Record<string, unknown>;

type EventCallback<T> = (payload: T) => void;

export class EventBus<TEvents extends EventMap = EventMap> {
  private listeners = new Map<keyof TEvents, Set<EventCallback<unknown>>>();

  on<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  off<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as EventCallback<unknown>);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        cb(payload);
      }
    }
  }
}

export const eventBus = new EventBus();
