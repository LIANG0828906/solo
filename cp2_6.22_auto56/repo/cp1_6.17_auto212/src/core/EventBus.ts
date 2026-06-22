export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'dusk'

export interface WeatherChangeEvent {
  weather: WeatherType
}

export interface DensityChangeEvent {
  density: number
}

export interface FpsUpdateEvent {
  fps: number
}

export type EventType = {
  WEATHER_CHANGE: WeatherChangeEvent
  DENSITY_CHANGE: DensityChangeEvent
  FPS_UPDATE: FpsUpdateEvent
}

type EventCallback<T = unknown> = (data: T) => void

class EventBusClass {
  private listeners: Map<keyof EventType, Set<EventCallback<EventType[keyof EventType]>>> = new Map()

  on<K extends keyof EventType>(event: K, callback: (data: EventType[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const set = this.listeners.get(event)!
    set.add(callback as EventCallback<EventType[keyof EventType]>)

    return () => {
      this.off(event, callback)
    }
  }

  off<K extends keyof EventType>(event: K, callback: (data: EventType[K]) => void): void {
    const set = this.listeners.get(event)
    if (set) {
      set.delete(callback as EventCallback<EventType[keyof EventType]>)
    }
  }

  emit<K extends keyof EventType>(event: K, data: EventType[K]): void {
    const set = this.listeners.get(event)
    if (set) {
      set.forEach((callback) => {
        callback(data)
      })
    }
  }
}

export const EventBus = new EventBusClass()
