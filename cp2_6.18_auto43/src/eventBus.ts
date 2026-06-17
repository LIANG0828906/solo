type EventType = 'record:added' | 'record:updated' | 'record:deleted' | 'range:changed';

type Callback = (payload?: unknown) => void;

const listeners: Map<EventType, Set<Callback>> = new Map();

export const eventBus = {
  on(event: EventType, cb: Callback) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(cb);
    return () => eventBus.off(event, cb);
  },
  off(event: EventType, cb: Callback) {
    const set = listeners.get(event);
    if (set) set.delete(cb);
  },
  emit(event: EventType, payload?: unknown) {
    const set = listeners.get(event);
    if (set) set.forEach((cb) => cb(payload));
  }
};
