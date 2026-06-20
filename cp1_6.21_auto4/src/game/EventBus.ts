import { GameEvents } from './types';

type EventCallback<T = any> = (data: T) => void;

class EventBus {
  private listeners: Map<keyof GameEvents, Set<EventCallback>> = new Map();

  on<K extends keyof GameEvents>(event: K, callback: (data: GameEvents[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);

    return () => {
      this.off(event, callback);
    };
  }

  off<K extends keyof GameEvents>(event: K, callback: (data: GameEvents[K]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
    }
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
export default eventBus;
