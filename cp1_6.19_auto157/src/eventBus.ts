type EventMap = {
  BOTTLE_THROWN: { id: string; text: string; emotion: Emotion; createdAt: number };
  BOTTLE_RECEIVED: { id: string };
  BOTTLE_OPENED: { id: string };
  ECHO_SENT: { bottleId: string; echoText: string };
  BOTTLE_ARCHIVED: { id: string };
};

type Emotion = 'happy' | 'sad' | 'think' | 'surprise';

type EventHandler<T> = (payload: T) => void;

class EventBus {
  private listeners: Record<string, Set<EventHandler<unknown>>> = {};

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    if (!this.listeners[event as string]) {
      this.listeners[event as string] = new Set();
    }
    (this.listeners[event as string] as Set<EventHandler<EventMap[K]>>).add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    this.listeners[event as string]?.delete(handler as EventHandler<unknown>);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.listeners[event as string]?.forEach(handler => (handler as EventHandler<EventMap[K]>)(payload));
  }
}

export const eventBus = new EventBus();
export type { Emotion, EventMap };
