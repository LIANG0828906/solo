type EventCallback = (...args: any[]) => void;

interface EventHandler {
  callback: EventCallback;
  once: boolean;
}

export class EventBus {
  private events: Map<string, EventHandler[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push({ callback, once: false });
  }

  off(event: string, callback: EventCallback): void {
    const handlers = this.events.get(event);
    if (!handlers) return;

    const index = handlers.findIndex(h => h.callback === callback);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (!handlers) return;

    const toRemove: number[] = [];
    handlers.forEach((handler, index) => {
      handler.callback(...args);
      if (handler.once) {
        toRemove.push(index);
      }
    });

    for (let i = toRemove.length - 1; i >= 0; i--) {
      handlers.splice(toRemove[i], 1);
    }
  }

  once(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push({ callback, once: true });
  }

  clear(): void {
    this.events.clear();
  }

  hasListeners(event: string): boolean {
    return this.events.has(event) && this.events.get(event)!.length > 0;
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  NODE_ADD: 'node:add',
  NODE_REMOVE: 'node:remove',
  NODE_HIGHLIGHT: 'node:highlight',
  NODE_UNHIGHLIGHT: 'node:unhighlight',
  LINK_ADD: 'link:add',
  LINK_REMOVE: 'link:remove',
  SIMULATION_TOGGLE: 'simulation:toggle',
  SIMULATION_RESET: 'simulation:reset',
  SEARCH_QUERY: 'search:query',
  SEARCH_FOCUS: 'search:focus',
  HISTORY_UNDO: 'history:undo',
  HISTORY_REDO: 'history:redo',
  HISTORY_PUSH: 'history:push',
  NODE_COUNT_CHANGE: 'node:count:change',
  LABELS_UPDATE: 'labels:update',
} as const;
