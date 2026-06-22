type EventCallback<T = unknown> = (data: T) => void

interface EventMap {
  ENERGY_ALLOCATED: { engineRatio: number; shieldRatio: number }
  ENERGY_UPDATED: { engine: number; shield: number; totalConsumed: number }
  MINING_TRIGGERED: { playerXPercent: number }
  MINING_SUCCESS: {
    who: 'player' | 'npc'
    x: number
    y: number
    score: number
    energyCost: number
  }
  GAME_TICK: { deltaTime: number }
  GAME_START: void
  GAME_OVER: { playerScore: number; npcScore: number; energyUtilization: number }
  GAME_RESET: void
  ENERGY_WARNING: { engineLow: boolean; shieldLow: boolean }
}

type EventName = keyof EventMap

class EventBus {
  private listeners: Map<EventName, Set<EventCallback>> = new Map()

  on<K extends EventName>(event: K, callback: EventCallback<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as EventCallback)
    return () => this.off(event, callback)
  }

  off<K extends EventName>(event: K, callback: EventCallback<EventMap[K]>): void {
    this.listeners.get(event)?.delete(callback as EventCallback)
  }

  emit<K extends EventName>(event: K, data?: EventMap[K]): void {
    this.listeners.get(event)?.forEach((cb) => cb(data))
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
export type { EventMap, EventName }
