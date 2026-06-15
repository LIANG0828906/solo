export type EventMap = {
  processText: { text: string };
  onProcessComplete: {
    weibo: string;
    officialAccount: string;
    seo: string;
    keywords: string[];
  };
  saveSnapshot: {
    weibo: string;
    officialAccount: string;
    seo: string;
  };
  onSnapshotCreated: {
    id: string;
    timestamp: number;
  };
  showToast: { message: string };
};

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void;

class EventBus {
  private handlers: Map<keyof EventMap, Set<Handler<any>>> = new Map();

  on<K extends keyof EventMap>(event: K, handler: Handler<K>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.handlers.get(event)?.forEach(h => h(payload));
  }
}

export const eventBus = new EventBus();
