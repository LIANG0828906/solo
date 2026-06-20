type EventCallback<T = unknown> = (data: T) => void

interface EventMap {
  ChangeSpeed: number
  ChangeHeightRange: { min: number; max: number }
  ChangeColorTheme: string
  BuildStats: { count: number; total: number }
  BuildingHover: string | null
}

type EventName = keyof EventMap

class EventBus {
  private events: Map<EventName, Set<EventCallback>> = new Map()

  on<E extends EventName>(event: E, callback: EventCallback<EventMap[E]>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback as EventCallback)
  }

  off<E extends EventName>(event: E, callback: EventCallback<EventMap[E]>): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.delete(callback as EventCallback)
    }
  }

  emit<E extends EventName>(event: E, data: EventMap[E]): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach((cb) => cb(data))
    }
  }

  once<E extends EventName>(event: E, callback: EventCallback<EventMap[E]>): void {
    const wrapper = (data: EventMap[E]) => {
      callback(data)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }
}

export const eventBus = new EventBus()
export type { EventMap, EventName, EventCallback }
