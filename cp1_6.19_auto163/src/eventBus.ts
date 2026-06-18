type EventHandler = (...args: unknown[]) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((handler) => handler(...args));
  }
}

export const eventBus = new EventBus();

export type EventType =
  | 'rehearsal:created'
  | 'rehearsal:updated'
  | 'rehearsal:deleted'
  | 'conflict:detected'
  | 'participant:added'
  | 'participant:removed'
  | 'progress:updated'
  | 'recommendation:generate'
  | 'piece:created'
  | 'piece:updated'
  | 'member:created'
  | 'member:updated';
