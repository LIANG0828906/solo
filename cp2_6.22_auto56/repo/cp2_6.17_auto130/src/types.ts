export interface BodyState {
  id: string;
  name: string;
  type: 'star' | 'planet';
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  mass: number;
  radius: number;
  color: string;
  orbitRadius: number;
  angularSpeed: number;
  angle: number;
  emissiveIntensity?: number;
}

export interface EngineConfig {
  gravitationalConstant: number;
  starMass: number;
}

export type EventCallback = (...args: unknown[]) => void;

export class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }
}
