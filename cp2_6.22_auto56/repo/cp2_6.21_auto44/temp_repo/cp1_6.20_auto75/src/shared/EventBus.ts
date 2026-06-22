type EventCallback = (data?: unknown) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: unknown): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  once(event: string, callback: EventCallback): void {
    const onceCallback = (data?: unknown) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  clear(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  TEAM_SUBMITTED: 'team:submitted',
  BATTLE_RESULT: 'battle:result',
  BATTLE_LOG: 'battle:log',
  BATTLE_START: 'battle:start',
  BATTLE_END: 'battle:end',
  DRAGON_ACTION: 'dragon:action',
} as const;
