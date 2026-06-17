type EventCallback = (data: any) => void

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

  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data)
        } catch (e) {
          console.error(`Error in event handler for ${event}:`, e)
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
  PLAYER_POSITION: 'player:position',
  PLAYER_COLLISION: 'player:collision',
  SHARD_COLLECTED: 'shard:collected',
  GAME_SCORE_UPDATE: 'game:scoreUpdate',
  GAME_ENERGY_UPDATE: 'game:energyUpdate',
  GAME_LEVEL_UP: 'game:levelUp',
  GAME_GAME_OVER: 'game:gameOver',
  GAME_RESTART: 'game:restart',
  GAME_PAUSE: 'game:pause',
  GAME_START: 'game:start',
  RENDER_CANYON_CHUNK: 'render:canyonChunk',
  RENDER_REMOVE_CHUNK: 'render:removeChunk',
  EFFECTS_GLOW_PULSE: 'effects:glowPulse',
  EFFECTS_SCREEN_FLASH: 'effects:screenFlash',
  EFFECTS_SHAKE: 'effects:shake',
  EFFECTS_SHARD_PICKUP: 'effects:shardPickup',
  INPUT_MOUSE_MOVE: 'input:mouseMove',
}
