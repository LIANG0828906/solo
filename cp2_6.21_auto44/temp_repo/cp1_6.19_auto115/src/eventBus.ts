type EventCallback = (...args: any[]) => void

class EventBus {
  private events: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(...args)
        } catch (e) {
          console.error(`Error in event handler for "${event}":`, e)
        }
      })
    }
  }

  clear(): void {
    this.events.clear()
  }
}

export const eventBus = new EventBus()

export const EVENTS = {
  COMBAT_START: 'combat:start',
  COMBAT_END: 'combat:end',
  PLAYER_ATTACK: 'combat:playerAttack',
  ENEMY_ATTACK: 'combat:enemyAttack',
  EQUIPMENT_DROP: 'loot:drop',
  EQUIPMENT_CHANGED: 'inventory:equipmentChanged',
  STATS_CHANGED: 'player:statsChanged',
  PLAYER_MOVED: 'player:moved',
  ROOM_EXPLORED: 'dungeon:roomExplored',
  DUNGEON_GENERATED: 'dungeon:generated',
  INVENTORY_CHANGED: 'inventory:changed',
} as const
