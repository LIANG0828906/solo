import { AppEventType, AppEventPayload } from './types';

type EventCallback = (payload: AppEventPayload) => void;

class EventBus {
  private listeners: Map<AppEventType, Set<EventCallback>> = new Map();

  on(eventType: AppEventType, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: AppEventType, callback: EventCallback): void {
    this.listeners.get(eventType)?.delete(callback);
  }

  emit(eventType: AppEventType, payload: AppEventPayload): void {
    const callbacks = this.listeners.get(eventType);
    if (!callbacks) return;
    queueMicrotask(() => {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error('[EventBus] 事件处理错误:', err);
        }
      });
    });
  }
}

export const eventBus = new EventBus();
