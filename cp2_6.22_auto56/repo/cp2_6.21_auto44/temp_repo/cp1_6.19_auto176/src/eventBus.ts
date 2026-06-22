type EventHandler = (payload?: unknown) => void;

class EventBus {
  private static instance: EventBus | null = null;
  private handlers: Map<string, Set<EventHandler>>;

  private constructor() {
    this.handlers = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler);
    }
  }

  emit(event: string, payload?: unknown): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`EventBus handler error for "${event}":`, e);
        }
      });
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = EventBus.getInstance();

export const EVENTS = {
  FRAME_UPDATE: 'frame:update',
  SEGMENT_ADDED: 'segment:added',
  SEGMENT_REMOVED: 'segment:removed',
  THEME_CHANGED: 'theme:changed',
  MODE_CHANGED: 'mode:changed',
  PLAY_STATE_CHANGED: 'playstate:changed',
  COLOR_CHANGED: 'color:changed'
} as const;
