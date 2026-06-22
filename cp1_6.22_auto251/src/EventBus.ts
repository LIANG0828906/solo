import type { EventPayloadMap, EventType } from './types';

type EventCallback<T extends EventType> = (payload: EventPayloadMap[T]) => void;

export class EventBus {
  private listeners: Map<EventType, Set<EventCallback<EventType>>> = new Map();

  on<T extends EventType>(event: T, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<EventType>);
  }

  off<T extends EventType>(event: T, callback: EventCallback<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback as EventCallback<EventType>);
    }
  }

  emit<T extends EventType>(event: T, payload: EventPayloadMap[T]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        callback(payload);
      });
    }
  }
}

export const eventBus = new EventBus();
