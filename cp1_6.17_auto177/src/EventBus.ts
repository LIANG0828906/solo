import type { BusEvent, EventCallback } from './types'

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  on(type: BusEvent['type'], callback: EventCallback): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
  }

  off(type: BusEvent['type'], callback: EventCallback): void {
    const set = this.listeners.get(type)
    if (set) {
      set.delete(callback)
      if (set.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  emit(event: BusEvent): void {
    const set = this.listeners.get(event.type)
    if (set) {
      for (const cb of set) {
        try {
          cb(event)
        } catch (err) {
          console.error(`[EventBus] listener error on ${event.type}:`, err)
        }
      }
    }
  }
}

export const eventBus = new EventBus()
