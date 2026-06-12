import { EventName, EventMap, EventHandler } from './types';

export class EventBus {
  private static instance: EventBus | null = null;
  private handlers: Map<EventName, Set<EventHandler<EventName>>>;

  private constructor() {
    this.handlers = new Map();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<T extends EventName>(event: T, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler<EventName>);
  }

  public off<T extends EventName>(event: T, handler: EventHandler<T>): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler as EventHandler<EventName>);
      if (eventHandlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  public emit<T extends EventName>(event: T, data: EventMap[T]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        handler(data);
      });
    }
  }
}
