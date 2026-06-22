import { EventEmitter } from 'events';

export const APP_READY = 'app:ready';
export const SIMULATION_UPDATE = 'simulation:update';
export const HEATMAP_UPDATE = 'heatmap:update';
export const FISH_CLICKED = 'fish:clicked';

class EventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.emitter.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.emitter.off(event, listener);
  }

  emit(event: string, ...args: any[]): void {
    this.emitter.emit(event, ...args);
  }

  once(event: string, listener: (...args: any[]) => void): void {
    this.emitter.once(event, listener);
  }
}

export const eventBus = new EventBus();
