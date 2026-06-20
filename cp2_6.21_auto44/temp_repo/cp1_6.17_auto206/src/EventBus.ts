import type { SensorPoint } from './GeoDataSource'

export type WindLevel = 'calm' | 'breeze' | 'strong'

export type EventMap = {
  'scene:ready': void
  'time:change': number
  'filter:change': { humidityRange: [number, number]; windLevel: WindLevel }
  'sensor:click': SensorPoint
  'sensor:hover': { point: SensorPoint; hovering: boolean }
  'camera:reset': void
  'screenshot:export': void
}

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void

export class EventBus {
  private handlers: { [K in keyof EventMap]?: Set<Handler<K>> } = {}

  on<K extends keyof EventMap>(event: K, handler: Handler<K>): () => void {
    const map = this.handlers as Record<string, Set<Handler<K>>>
    if (!map[event]) {
      map[event] = new Set()
    }
    map[event].add(handler)
    return () => this.off(event, handler)
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<K>): void {
    const map = this.handlers as Record<string, Set<Handler<K>>>
    map[event]?.delete(handler)
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const map = this.handlers as Record<string, Set<Handler<K>>>
    map[event]?.forEach((h) => h(payload))
  }

  clear(): void {
    this.handlers = {}
  }
}

export const eventBus = new EventBus()
