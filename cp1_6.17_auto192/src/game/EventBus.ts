import type { GameEvents } from './types';

type EventCallback<T> = (data: T) => void;

type ListenerMap = {
  [K in keyof GameEvents]?: Set<EventCallback<GameEvents[K]>>;
};

export class EventBus {
  private listeners: ListenerMap = {};

  on<K extends keyof GameEvents>(
    event: K,
    callback: EventCallback<GameEvents[K]>
  ): () => void {
    if (!this.listeners[event]) {
      (this.listeners as Record<string, unknown>)[event] = new Set<EventCallback<GameEvents[K]>>();
    }
    const set = this.listeners[event] as Set<EventCallback<GameEvents[K]>>;
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const set = this.listeners[event] as Set<EventCallback<GameEvents[K]>> | undefined;
    set?.forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error(`EventBus error in ${event}:`, e);
      }
    });
  }

  clear(): void {
    this.listeners = {};
  }
}

export const eventBus = new EventBus();
