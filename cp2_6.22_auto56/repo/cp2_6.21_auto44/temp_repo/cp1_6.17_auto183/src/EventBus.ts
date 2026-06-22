type EventCallback = (...args: any[]) => void

type EventMap = {
  beat: [number]
  noteCollected: [string]
  obstacleHit: [string]
  playerMove: [number]
  gameOver: []
  levelUp: [number]
  audioAnalyzed: [number, number[]]
  startGame: []
  pauseGame: []
  resumeGame: []
  restartGame: []
}

type EventName = keyof EventMap

class EventBus {
  private listeners: Map<EventName, Set<EventCallback>> = new Map()

  on<E extends EventName>(event: E, callback: (...args: EventMap[E]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return () => this.off(event, callback)
  }

  off<E extends EventName>(event: E, callback: (...args: EventMap[E]) => void): void {
    const set = this.listeners.get(event)
    if (set) {
      set.delete(callback)
    }
  }

  emit<E extends EventName>(event: E, ...args: EventMap[E]): void {
    const set = this.listeners.get(event)
    if (set) {
      set.forEach((callback) => callback(...args))
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
export type { EventName, EventMap }
