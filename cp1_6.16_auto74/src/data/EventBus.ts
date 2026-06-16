type Handler<T = unknown> = (data: T) => void;

export class EventBus {
  private handlers: Map<string, Set<Handler>> = new Map();

  on<T>(event: string, handler: Handler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as Handler);
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: Handler<T>): void {
    this.handlers.get(event)?.delete(handler as Handler);
  }

  emit<T>(event: string, data: T): void {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }
}
