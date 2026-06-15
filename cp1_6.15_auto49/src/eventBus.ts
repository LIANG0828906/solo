type EventCallback = (...args: any[]) => void

class EventBus {
  private events: Record<string, EventCallback[]> = {}

  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return
    this.events[event].forEach(callback => {
      callback(...args)
    })
  }
}

export const eventBus = new EventBus()

export type LightData = {
  id: number
  color: string
  brightness: number
}

export type AnimationMode = 'static' | 'breathing' | 'alternating' | 'flowing'

declare module './eventBus' {
  interface EventBus {
    on(event: 'lightUpdate', callback: (lights: LightData[]) => void): void
    on(event: 'animationChange', callback: (mode: AnimationMode) => void): void
    on(event: 'selectLight', callback: (id: number | null) => void): void
    on(event: 'selectAll', callback: () => void): void
    on(event: 'brightnessChange', callback: (value: number) => void): void
    on(event: 'colorChange', callback: (color: string) => void): void
    emit(event: 'lightUpdate', lights: LightData[]): void
    emit(event: 'animationChange', mode: AnimationMode): void
    emit(event: 'selectLight', id: number | null): void
    emit(event: 'selectAll'): void
    emit(event: 'brightnessChange', value: number): void
    emit(event: 'colorChange', color: string): void
  }
}
