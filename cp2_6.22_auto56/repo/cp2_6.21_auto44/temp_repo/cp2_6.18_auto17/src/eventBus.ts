export type EventType =
  | 'game:start'
  | 'game:pause'
  | 'game:over'
  | 'game:victory'
  | 'wave:start'
  | 'wave:end'
  | 'wave:countdown'
  | 'tower:place'
  | 'tower:upgrade'
  | 'tower:select'
  | 'tower:deselect'
  | 'tower:attack'
  | 'zombie:spawn'
  | 'zombie:hit'
  | 'zombie:death'
  | 'zombie:reachEnd'
  | 'ui:towerSelected'
  | 'ui:upgradeConfirm'
  | 'ui:goldUpdate'
  | 'ui:livesUpdate'
  | 'ui:waveUpdate'
  | 'ui:startWave'
  | 'render:updateTower'
  | 'render:removeTower'
  | 'render:updateZombie'
  | 'render:removeZombie'
  | 'render:addProjectile'
  | 'render:removeProjectile'
  | 'render:addDeathEffect'
  | 'render:muzzleFlash'

export type EventCallback = (data?: unknown) => void

export class EventBus {
  private static instance: EventBus
  private listeners: Map<EventType, Set<EventCallback>> = new Map()

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  on(event: EventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: EventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  emit(event: EventType, data?: unknown): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = EventBus.getInstance()
