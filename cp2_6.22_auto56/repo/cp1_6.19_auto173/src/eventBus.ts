type EventCallback = (...args: any[]) => void

class EventBus {
  private events: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
    return () => this.off(event, callback)
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) return
    const callbacks = this.events.get(event)!.filter(cb => cb !== callback)
    this.events.set(event, callbacks)
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return
    this.events.get(event)!.forEach(callback => {
      try {
        callback(...args)
      } catch (e) {
        console.error(`EventBus error in event "${event}":`, e)
      }
    })
  }
}

export const eventBus = new EventBus()

export const EVENTS = {
  PUZZLE_COMPLETE: 'puzzle:complete',
  PIECE_PLACED: 'piece:placed',
  PIECE_MISPLACED: 'piece:misplaced',
  PIECE_ROTATED: 'piece:rotated',
  HINT_REQUESTED: 'hint:requested',
} as const
