type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    return () => this.off(event, callback);
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

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  POLICY_TOGGLE: 'policy:toggle',
  START_SIMULATION: 'simulation:start',
  SIMULATION_COMPLETE: 'simulation:complete',
  SAVE_SNAPSHOT: 'snapshot:save',
  LOAD_SNAPSHOT: 'snapshot:load',
  DELETE_SNAPSHOT: 'snapshot:delete',
  CLEAR_SELECTION: 'selection:clear',
  CLEAR_SNAPSHOTS: 'snapshots:clear',
} as const;
