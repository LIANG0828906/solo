type Handler<T> = (data: T) => void;

interface EventMap {
  yearChange: number;
  autoRotateToggle: boolean;
  hoverData: {
    lon: number;
    lat: number;
    temp: number;
    screenX: number;
    screenY: number;
  } | null;
}

type EventKey = keyof EventMap;

class EventBus {
  private handlers: { [K in EventKey]?: Set<Handler<EventMap[K]>> } = {};

  private getSet<K extends EventKey>(key: K): Set<Handler<EventMap[K]>> | undefined {
    return this.handlers[key] as Set<Handler<EventMap[K]>> | undefined;
  }

  private ensureSet<K extends EventKey>(key: K): Set<Handler<EventMap[K]>> {
    let set = this.getSet(key);
    if (!set) {
      set = new Set<Handler<EventMap[K]>>();
      (this.handlers as Record<EventKey, unknown>)[key] = set;
    }
    return set;
  }

  on<K extends EventKey>(key: K, handler: Handler<EventMap[K]>): () => void {
    this.ensureSet(key).add(handler);
    return () => {
      this.off(key, handler);
    };
  }

  off<K extends EventKey>(key: K, handler: Handler<EventMap[K]>): void {
    const set = this.getSet(key);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        delete this.handlers[key];
      }
    }
  }

  emit<K extends EventKey>(key: K, data: EventMap[K]): void {
    const set = this.getSet(key);
    if (set) {
      for (const h of set) {
        try {
          (h as Handler<EventMap[K]>)(data);
        } catch (err) {
          console.error('[EventBus] handler error for', key, err);
        }
      }
    }
  }
}

export { EventBus };
export type { EventMap };
