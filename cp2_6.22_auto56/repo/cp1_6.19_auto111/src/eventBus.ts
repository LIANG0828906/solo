type EventHandler = (data?: unknown) => void;

export class EventBus {
  private readonly listeners: Map<string, Set<EventHandler>>;

  constructor() {
    this.listeners = new Map();
  }

  public on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  public off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  public emit(event: string, data?: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  public once(event: string, handler: EventHandler): void {
    const wrapped: EventHandler = (data) => {
      this.off(event, wrapped);
      handler(data);
    };
    this.on(event, wrapped);
  }
}
