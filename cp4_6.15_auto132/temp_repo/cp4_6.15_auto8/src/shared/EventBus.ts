type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>>;

  constructor() {
    this.events = new Map();
  }

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(...args);
      });
    }
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  QUESTION_PUBLISHED: 'question:published',
  QUESTION_ENDED: 'question:ended',
  ANSWER_SUBMITTED: 'answer:submitted',
  STATS_UPDATED: 'stats:updated',
  TICK: 'tick',
};
