export enum EventType {
  CARD_UPDATED = 'card:updated',
  BATTLE_START = 'battle:start',
  BATTLE_PROGRESS = 'battle:progress',
  BATTLE_COMPLETE = 'battle:complete',
  SUGGESTION_APPLY = 'suggestion:apply',
}

type EventCallback = (data: unknown) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  on(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: EventType, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: EventType, data?: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

export const eventBus = new EventBus();
